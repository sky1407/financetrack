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
