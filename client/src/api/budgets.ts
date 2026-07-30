import { apiClient } from "./client";
import type { Budget } from "@/types";

export interface BudgetInput {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export async function apiListBudgets(month: number, year: number): Promise<Budget[]> {
  const { data } = await apiClient.get<{ budgets: Budget[] }>("/budgets", { params: { month, year } });
  return data.budgets;
}

export async function apiCreateBudget(input: BudgetInput): Promise<Budget> {
  const { data } = await apiClient.post<{ budget: Budget }>("/budgets", input);
  return data.budget;
}

export async function apiUpdateBudget(id: string, amount: number): Promise<Budget> {
  const { data } = await apiClient.patch<{ budget: Budget }>(`/budgets/${id}`, { amount });
  return data.budget;
}

export async function apiDeleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
