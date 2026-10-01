import type { AccountType, TransactionType } from "@/types";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Hotovosť",
  BANK: "Bankový účet",
  CARD: "Karta",
  SAVINGS: "Sporiaci účet",
  OTHER: "Iné",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Príjem",
  EXPENSE: "Výdavok",
};

export const CATEGORY_COLOR_SWATCHES = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#64748b",
  "#0ca30c",
];

/** Account types a bank statement can be imported into (mirrors the backend rule). */
export const IMPORTABLE_ACCOUNT_TYPES: readonly AccountType[] = ["BANK", "CARD", "SAVINGS"];

/** Must match the server's upload limit. */
export const MAX_STATEMENT_BYTES = 2 * 1024 * 1024;
