import { apiClient } from "./client";
import { isDemoMode } from "@/lib/demoMode";
import { demoStore } from "@/lib/demoStore";
import type { Category, CategoryType } from "@/types";

export interface CategoryInput {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export async function apiListCategories(): Promise<Category[]> {
  if (isDemoMode()) return demoStore.listCategories();
  const { data } = await apiClient.get<{ categories: Category[] }>("/categories");
  return data.categories;
}

export async function apiCreateCategory(input: CategoryInput): Promise<Category> {
  if (isDemoMode()) return demoStore.createCategory(input);
  const { data } = await apiClient.post<{ category: Category }>("/categories", input);
  return data.category;
}

export async function apiUpdateCategory(id: string, input: Partial<Omit<CategoryInput, "type">>): Promise<Category> {
  if (isDemoMode()) return demoStore.updateCategory(id, input);
  const { data } = await apiClient.patch<{ category: Category }>(`/categories/${id}`, input);
  return data.category;
}

export async function apiDeleteCategory(id: string): Promise<void> {
  if (isDemoMode()) return demoStore.deleteCategory(id);
  await apiClient.delete(`/categories/${id}`);
}
