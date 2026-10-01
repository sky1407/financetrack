import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { CategoryRule, CreatedCategoryRule } from "@/types";

export interface CategoryRuleInput {
  pattern: string;
  categoryId: string;
}

export async function apiListCategoryRules(): Promise<CategoryRule[]> {
  if (isDemoMode()) return demoStore.listCategoryRules();
  const { data } = await apiClient.get<{ rules: CategoryRule[] }>("/category-rules");
  return data.rules;
}

/** Creates (or re-points) a rule; the server also recategorizes matching "Nezaradené" transactions. */
export async function apiCreateCategoryRule(input: CategoryRuleInput): Promise<CreatedCategoryRule> {
  if (isDemoMode()) return demoStore.createCategoryRule(input);
  const { data } = await apiClient.post<CreatedCategoryRule>("/category-rules", input);
  return data;
}

export async function apiDeleteCategoryRule(id: string): Promise<void> {
  if (isDemoMode()) return demoStore.deleteCategoryRule(id);
  await apiClient.delete(`/category-rules/${id}`);
}
