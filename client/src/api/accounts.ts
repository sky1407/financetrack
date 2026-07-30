import { apiClient } from "./client";
import type { Account, AccountType } from "@/types";

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}

export async function apiListAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<{ accounts: Account[] }>("/accounts");
  return data.accounts;
}

export async function apiCreateAccount(input: AccountInput): Promise<Account> {
  const { data } = await apiClient.post<{ account: Account }>("/accounts", input);
  return data.account;
}

export async function apiUpdateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  const { data } = await apiClient.patch<{ account: Account }>(`/accounts/${id}`, input);
  return data.account;
}

export async function apiDeleteAccount(id: string): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}
