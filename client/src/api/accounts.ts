import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { Account, AccountType } from "@/types";

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}

export async function apiListAccounts(): Promise<Account[]> {
  if (isDemoMode()) return demoStore.listAccounts();
  const { data } = await apiClient.get<{ accounts: Account[] }>("/accounts");
  return data.accounts;
}

export async function apiCreateAccount(input: AccountInput): Promise<Account> {
  if (isDemoMode()) return demoStore.createAccount(input);
  const { data } = await apiClient.post<{ account: Account }>("/accounts", input);
  return data.account;
}

export async function apiUpdateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  if (isDemoMode()) return demoStore.updateAccount(id, input);
  const { data } = await apiClient.patch<{ account: Account }>(`/accounts/${id}`, input);
  return data.account;
}

export async function apiDeleteAccount(id: string): Promise<void> {
  if (isDemoMode()) return demoStore.deleteAccount(id);
  await apiClient.delete(`/accounts/${id}`);
}
