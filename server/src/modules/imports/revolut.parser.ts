import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import type { TransactionType } from "@prisma/client";
import { AppError } from "../../utils/AppError.js";

/**
 * Header names per column in the English and Slovak Revolut exports (the export language follows the app locale).
 * Keys are the canonical names used inside the parser.
 */
const COLUMN_ALIASES = {
  type: ["Type", "Typ"],
  product: ["Product", "Produkt"],
  startedDate: ["Started Date", "Dátum začiatku"],
  completedDate: ["Completed Date", "Dátum dokončenia"],
  description: ["Description", "Popis"],
  amount: ["Amount", "Suma"],
  fee: ["Fee", "Poplatok"],
  currency: ["Currency", "Mena"],
  state: ["State", "Stav"],
  balance: ["Balance", "Zostatok"],
} as const satisfies Record<string, readonly string[]>;

type Column = keyof typeof COLUMN_ALIASES;

const COLUMNS = Object.keys(COLUMN_ALIASES) as Column[];

/**
 * Columns whose values do not depend on the export language, so the same movement
 * exported in English and in Slovak gets the same fingerprint.
 */
const FINGERPRINT_COLUMNS: readonly Column[] = [
  "startedDate",
  "completedDate",
  "description",
  "amount",
  "fee",
  "currency",
  "balance",
];

const COMPLETED_STATES: ReadonlySet<string> = new Set(["COMPLETED", "DOKONČENÉ"]);

/** Revolut sub-account a row belongs to; the main account and savings are separate balances. */
export type StatementProduct = "CURRENT" | "SAVINGS";

const PRODUCT_NAMES: Record<StatementProduct, ReadonlySet<string>> = {
  CURRENT: new Set(["Current", "Bežný"]),
  SAVINGS: new Set(["Savings", "Deposit", "Vklad"]),
};

/** Matches Transaction.note max length in the API schema. */
const MAX_DESCRIPTION_LENGTH = 200;
/** Upper bound of a Decimal(12, 2) column, in cents. */
const MAX_AMOUNT_CENTS = 999_999_999_999;

const DECIMAL = /^-?\d+(\.\d{1,2})?$/;

const rowSchema = z.object({
  type: z.string(),
  product: z.string(),
  startedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/, "neplatný dátum"),
  completedDate: z.string(),
  description: z.string(),
  amount: z.string().regex(DECIMAL, "neplatná suma"),
  fee: z.string().regex(DECIMAL, "neplatný poplatok"),
  currency: z.string().regex(/^[A-Z]{3}$/, "neplatná mena"),
  state: z.string(),
  balance: z.string(),
});

type RevolutRow = z.infer<typeof rowSchema>;

/** A transaction extracted from a statement, ready to be mapped onto the Transaction model. */
export interface ParsedTransaction {
  /** Deterministic hash of the source row; re-importing the same statement yields the same values. */
  fingerprint: string;
  type: TransactionType;
  /** Absolute amount as a fixed 2-decimal string, so it is stored as Decimal without float rounding. */
  amount: string;
  currency: string;
  /** Calendar day at UTC midnight, the same convention as manually entered transactions. */
  date: Date;
  description: string;
}

export interface SkippedRow {
  /** 1-based record number in the file (the header is record 1). */
  row: number;
  reason: string;
}

export interface StatementParseResult {
  transactions: ParsedTransaction[];
  skipped: SkippedRow[];
}

export interface RevolutParseOptions {
  /** Only rows in this currency are imported, because an app account holds a single currency. */
  currency: string;
  /** Only rows of this product are imported, so savings transfers are not mixed into the main account. */
  product: StatementProduct;
}

/**
 * Parses a Revolut account statement CSV (English or Slovak export) into transactions.
 * Only completed rows of the requested product and currency are imported; a non-zero fee becomes a separate expense.
 * Invalid or ignored rows are reported in `skipped` instead of failing the whole file.
 * @throws AppError (400) when the file is not a CSV or lacks the Revolut columns.
 */
export function parseRevolutStatement(csv: string, options: RevolutParseOptions): StatementParseResult {
  const [header, ...records] = readCsv(csv);
  if (!header) throw AppError.badRequest("Súbor je prázdny.");

  const columnIndex = new Map<Column, number>();
  const missing: string[] = [];
  for (const column of COLUMNS) {
    const index = header.findIndex((name) => (COLUMN_ALIASES[column] as readonly string[]).includes(name));
    if (index === -1) missing.push(COLUMN_ALIASES[column][0]);
    else columnIndex.set(column, index);
  }
  if (missing.length > 0) {
    throw AppError.badRequest(`Súbor nevyzerá ako výpis z Revolutu. Chýbajú stĺpce: ${missing.join(", ")}.`);
  }

  const result: StatementParseResult = { transactions: [], skipped: [] };

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const skip = (reason: string) => result.skipped.push({ row: rowNumber, reason });

    if (record.length !== header.length) return skip("nesprávny počet stĺpcov");

    const parsed = rowSchema.safeParse(
      Object.fromEntries(COLUMNS.map((column) => [column, record[columnIndex.get(column) as number]]))
    );
    if (!parsed.success) return skip(parsed.error.issues[0]?.message ?? "neplatný riadok");
    const row = parsed.data;

    if (!COMPLETED_STATES.has(row.state)) return skip(`stav ${row.state || "neznámy"}`);
    if (!PRODUCT_NAMES[options.product].has(row.product)) return skip(`iný produkt (${row.product})`);
    if (row.currency !== options.currency) return skip(`iná mena (${row.currency})`);

    const date = toCalendarDay(row.startedDate);
    if (!date) return skip("neplatný dátum");

    const amountCents = toCents(row.amount);
    // Revolut reports the fee as a positive number deducted on top of the amount.
    const feeCents = -toCents(row.fee);
    if (Math.abs(amountCents) > MAX_AMOUNT_CENTS || Math.abs(feeCents) > MAX_AMOUNT_CENTS) {
      return skip("suma mimo povoleného rozsahu");
    }
    if (amountCents === 0 && feeCents === 0) return skip("nulová suma");

    const description = (row.description || row.type).slice(0, MAX_DESCRIPTION_LENGTH);
    const rowKey = fingerprintSource(row);

    if (amountCents !== 0) {
      result.transactions.push(toTransaction(amountCents, row.currency, date, description, rowKey));
    }
    if (feeCents !== 0) {
      const feeDescription = `Poplatok – ${description}`.slice(0, MAX_DESCRIPTION_LENGTH);
      result.transactions.push(toTransaction(feeCents, row.currency, date, feeDescription, `${rowKey}\u001ffee`));
    }
  });

  return result;
}

function readCsv(csv: string): string[][] {
  try {
    return parse(csv, { bom: true, trim: true, skip_empty_lines: true, relax_column_count: true });
  } catch {
    throw AppError.badRequest("Súbor nie je platné CSV.");
  }
}

/** Two otherwise identical payments still differ by the running balance. */
function fingerprintSource(row: RevolutRow): string {
  return FINGERPRINT_COLUMNS.map((column) => row[column]).join("\u001f");
}

function toTransaction(
  signedCents: number,
  currency: string,
  date: Date,
  description: string,
  fingerprintKey: string
): ParsedTransaction {
  return {
    fingerprint: createHash("sha256").update(fingerprintKey).digest("hex"),
    type: signedCents > 0 ? "INCOME" : "EXPENSE",
    amount: formatCents(Math.abs(signedCents)),
    currency,
    date,
    description,
  };
}

/** Returns the date part as UTC midnight, or null for impossible dates such as 2024-02-30. */
function toCalendarDay(dateTime: string): Date | null {
  const day = dateTime.slice(0, 10);
  const date = new Date(`${day}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day) ? date : null;
}

/** Converts a validated decimal string (at most 2 fraction digits) to integer cents without float math. */
function toCents(value: string): number {
  const negative = value.startsWith("-");
  const [whole = "0", fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

function formatCents(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
