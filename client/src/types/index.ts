/**
 * Shared types matching the JSON shape returned by the backend.
 * Monetary values (Prisma Decimal) arrive in JSON as strings.
 */

export type AccountType = "CASH" | "BANK" | "CARD" | "SAVINGS" | "OTHER";
export type CategoryType = "INCOME" | "EXPENSE";
export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  currentBalance: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  note: string | null;
  date: string;
  createdAt: string;
  account: Account;
  category: Category;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionsPage {
  items: Transaction[];
  pagination: Pagination;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: string;
  month: number;
  year: number;
  category: Category;
  spent: string;
  remaining: string;
  percentage: number;
}

export interface DashboardCategorySpending {
  name: string;
  color: string;
  amount: string;
}

export interface DashboardTrendPoint {
  month: string;
  income: string;
  expense: string;
  net: string;
}

export interface DashboardSummary {
  month: number;
  year: number;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpense: string;
  monthlyNet: string;
  accountsCount: number;
  spendingByCategory: DashboardCategorySpending[];
  trend: DashboardTrendPoint[];
}

export interface ApiErrorBody {
  error: string;
}

export type ImportStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface SkippedRow {
  row: number;
  reason: string;
}

/** A bank statement upload and the outcome of its background processing. */
export interface StatementImport {
  id: string;
  accountId: string;
  fileName: string;
  status: ImportStatus;
  imported: number;
  duplicates: number;
  skippedRows: SkippedRow[] | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
