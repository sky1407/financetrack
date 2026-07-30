import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiCreateCategory, apiDeleteCategory, apiListCategories, apiUpdateCategory, type CategoryInput } from "@/api/categories";

const CATEGORIES_KEY = ["categories"];

export function useCategories() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: CATEGORIES_KEY, queryFn: apiListCategories });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  }

  const createMutation = useMutation({
    mutationFn: (input: CategoryInput) => apiCreateCategory(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<CategoryInput, "type">> }) => apiUpdateCategory(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteCategory(id),
    onSuccess: invalidate,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
  };
}
