import { describe, expect, it } from "vitest";
import { parseRevolutStatement } from "../../src/modules/imports/revolut.parser.js";
import { AppError } from "../../src/utils/AppError.js";

// All rows are fictional; real statements must never be committed.
const HEADER = "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

const EUR = { currency: "EUR", product: "CURRENT" } as const;

describe("parseRevolutStatement", () => {
  it("maps signed amounts to income and expense transactions", () => {
    const { transactions, skipped } = parseRevolutStatement(
      csv(
        "TOPUP,Current,2026-03-01 08:15:00,2026-03-01 08:15:02,Top-up by *1234,1500,0.00,EUR,COMPLETED,1500.00",
        "CARD_PAYMENT,Current,2026-03-02 18:40:11,2026-03-03 09:00:00,Lidl,-23.5,0.00,EUR,COMPLETED,1476.50"
      ),
      EUR
    );

    expect(skipped).toEqual([]);
    expect(transactions).toMatchObject([
      { type: "INCOME", amount: "1500.00", currency: "EUR", description: "Top-up by *1234" },
      { type: "EXPENSE", amount: "23.50", currency: "EUR", description: "Lidl" },
    ]);
    expect(transactions[1]?.date.toISOString()).toBe("2026-03-02T00:00:00.000Z");
  });

  it("creates a separate expense for a non-zero fee", () => {
    const { transactions } = parseRevolutStatement(
      csv("ATM,Current,2026-03-05 10:00:00,2026-03-05 10:00:01,Cash at ATM,-100,1.99,EUR,COMPLETED,1374.51"),
      EUR
    );

    expect(transactions).toMatchObject([
      { type: "EXPENSE", amount: "100.00", description: "Cash at ATM" },
      { type: "EXPENSE", amount: "1.99", description: "Poplatok – Cash at ATM" },
    ]);
    expect(transactions[0]?.fingerprint).not.toBe(transactions[1]?.fingerprint);
  });

  it("skips non-completed rows, other currencies, zero amounts and invalid values", () => {
    const { transactions, skipped } = parseRevolutStatement(
      csv(
        "CARD_PAYMENT,Current,2026-03-06 12:00:00,,Bolt,-8.20,0.00,EUR,PENDING,",
        "CARD_PAYMENT,Current,2026-03-06 12:05:00,,Bolt,-8.20,0.00,EUR,REVERTED,",
        "CARD_PAYMENT,Current,2026-03-07 09:00:00,2026-03-07 09:00:01,Tesco,-12.00,0.00,CZK,COMPLETED,500.00",
        "EXCHANGE,Current,2026-03-07 10:00:00,2026-03-07 10:00:01,Exchanged,0.00,0.00,EUR,COMPLETED,1374.51",
        "CARD_PAYMENT,Current,2026-02-30 10:00:00,2026-03-01 10:00:00,Bad date,-1.00,0.00,EUR,COMPLETED,1373.51",
        "CARD_PAYMENT,Current,2026-03-08 10:00:00,2026-03-08 10:00:00,Bad amount,-1.005,0.00,EUR,COMPLETED,1372.50",
        "CARD_PAYMENT,Current,2026-03-08 11:00:00"
      ),
      EUR
    );

    expect(transactions).toEqual([]);
    expect(skipped.map((s) => s.row)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(skipped.map((s) => s.reason)).toEqual([
      "stav PENDING",
      "stav REVERTED",
      "iná mena (CZK)",
      "nulová suma",
      "neplatný dátum",
      "neplatná suma",
      "nesprávny počet stĺpcov",
    ]);
  });

  it("produces stable fingerprints that distinguish otherwise identical payments by balance", () => {
    const first = "CARD_PAYMENT,Current,2026-03-09 08:00:00,2026-03-09 08:00:01,Coffee,-2.50,0.00,EUR,COMPLETED,97.50";
    const second = "CARD_PAYMENT,Current,2026-03-09 08:00:00,2026-03-09 08:00:01,Coffee,-2.50,0.00,EUR,COMPLETED,95.00";

    const a = parseRevolutStatement(csv(first, second), EUR).transactions;
    const b = parseRevolutStatement(csv(first), EUR).transactions;

    expect(a[0]?.fingerprint).toBe(b[0]?.fingerprint);
    expect(a[0]?.fingerprint).not.toBe(a[1]?.fingerprint);
  });

  it("handles a BOM, quoted fields and truncates long descriptions", () => {
    const longName = "X".repeat(250);
    const { transactions } = parseRevolutStatement(
      "﻿" + csv(`TRANSFER,Current,2026-03-10 07:00:00,2026-03-10 07:00:01,"Payment, ""rent""",-450,0.00,EUR,COMPLETED,10.00`,
        `CARD_PAYMENT,Current,2026-03-10 08:00:00,2026-03-10 08:00:01,${longName},-1,0.00,EUR,COMPLETED,9.00`),
      EUR
    );

    expect(transactions[0]?.description).toBe('Payment, "rent"');
    expect(transactions[1]?.description).toHaveLength(200);
  });

  it("parses the Slovak export with the same fingerprints as the English one", () => {
    const slovak = [
      "Typ,Produkt,Dátum začiatku,Dátum dokončenia,Popis,Suma,Poplatok,Mena,State,Zostatok",
      "Platba kartou,Bežný,2026-03-02 18:40:11,2026-03-03 09:00:00,Lidl,-23.50,0.00,EUR,DOKONČENÉ,1476.50",
    ].join("\n");
    const english = csv(
      "CARD_PAYMENT,Current,2026-03-02 18:40:11,2026-03-03 09:00:00,Lidl,-23.50,0.00,EUR,COMPLETED,1476.50"
    );

    const sk = parseRevolutStatement(slovak, EUR).transactions;
    const en = parseRevolutStatement(english, EUR).transactions;

    expect(sk).toMatchObject([{ type: "EXPENSE", amount: "23.50", description: "Lidl" }]);
    expect(sk[0]?.fingerprint).toBe(en[0]?.fingerprint);
  });

  it("imports only rows of the requested product", () => {
    const statement = csv(
      "TRANSFER,Current,2026-03-11 09:00:00,2026-03-11 09:00:01,To EUR Savings,-200,0.00,EUR,COMPLETED,800.00",
      "TRANSFER,Savings,2026-03-11 09:00:00,2026-03-11 09:00:01,From EUR Current,200,0.00,EUR,COMPLETED,200.00",
      "INTEREST,Savings,2026-03-12 00:00:00,2026-03-12 00:00:01,Interest earned,0.35,0.00,EUR,COMPLETED,200.35"
    );

    const current = parseRevolutStatement(statement, EUR);
    const savings = parseRevolutStatement(statement, { currency: "EUR", product: "SAVINGS" });

    expect(current.transactions).toMatchObject([{ type: "EXPENSE", amount: "200.00" }]);
    expect(current.skipped).toEqual([
      { row: 3, reason: "iný produkt (Savings)" },
      { row: 4, reason: "iný produkt (Savings)" },
    ]);
    expect(savings.transactions).toMatchObject([
      { type: "INCOME", amount: "200.00" },
      { type: "INCOME", amount: "0.35" },
    ]);
  });

  it("rejects empty files and files without the Revolut columns", () => {
    expect(() => parseRevolutStatement("", EUR)).toThrow(AppError);
    expect(() => parseRevolutStatement("Date,Amount\n2026-03-01,10", EUR)).toThrow(/Chýbajú stĺpce/);
  });
});
