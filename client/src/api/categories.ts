import { apiClient } from "./client";
import type { Category, CategoryType } from "@/types";

export interface CategoryInput {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export async function apiListCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<{ categories: Category[] }>("/categories");
  return data.categories;
}

export async function apiCreateCategory(input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.post<{ category: Category }>("/categories", input);
  return data.category;
}

export async function apiUpdateCategory(id: string, input: Partial<Omit<CategoryInput, "type">>): Promise<Category> {
  const { data } = await apiClient.patch<{ category: Category }>(`/categories/${id}`, input);
  return data.category;
}

export async function apiDeleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
