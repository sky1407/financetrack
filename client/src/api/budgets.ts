import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { Budget } from "@/types";

export interface BudgetInput {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export async function apiListBudgets(month: number, year: number): Promise<Budget[]> {
  if (isDemoMode()) return demoStore.listBudgets(month, year);
  const { data } = await apiClient.get<{ budgets: Budget[] }>("/budgets", { params: { month, year } });
  return data.budgets;
}

export async function apiCreateBudget(input: BudgetInput): Promise<Budget> {
  if (isDemoMode()) return demoStore.createBudget(input);
  const { data } = await apiClient.post<{ budget: Budget }>("/budgets", input);
  return data.budget;
}

export async function apiUpdateBudget(id: string, amount: number): Promise<Budget> {
  if (isDemoMode()) return demoStore.updateBudget(id, amount);
  const { data } = await apiClient.patch<{ budget: Budget }>(`/budgets/${id}`, { amount });
  return data.budget;
}

export async function apiDeleteBudget(id: string): Promise<void> {
  if (isDemoMode()) return demoStore.deleteBudget(id);
  await apiClient.delete(`/budgets/${id}`);
}
