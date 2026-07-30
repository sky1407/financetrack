import { apiClient } from "./client";
import type { Transaction, TransactionsPage, TransactionType } from "@/types";

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: string;
}

export async function apiListTransactions(filters: TransactionFilters): Promise<TransactionsPage> {
  const { data } = await apiClient.get<TransactionsPage>("/transactions", { params: filters });
  return data;
}

export async function apiCreateTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await apiClient.post<{ transaction: Transaction }>("/transactions", input);
  return data.transaction;
}

export async function apiUpdateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  const { data } = await apiClient.patch<{ transaction: Transaction }>(`/transactions/${id}`, input);
  return data.transaction;
}

export async function apiDeleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
