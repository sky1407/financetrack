/**
 * Zdieľané typy zodpovedajúce JSON tvaru, ktorý vracia backend.
 * Peňažné hodnoty (Prisma Decimal) prichádzajú v JSON ako reťazce.
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
