import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiCreateBudget, apiDeleteBudget, apiListBudgets, apiUpdateBudget, type BudgetInput } from "@/api/budgets";

export function useBudgets(month: number, year: number) {
  const queryClient = useQueryClient();
  const queryKey = ["budgets", month, year];
  const query = useQuery({ queryKey, queryFn: () => apiListBudgets(month, year) });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  const createMutation = useMutation({
    mutationFn: (input: BudgetInput) => apiCreateBudget(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => apiUpdateBudget(id, amount),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteBudget(id),
    onSuccess: invalidate,
  });

  return {
    budgets: query.data ?? [],
    isLoading: query.isLoading,
    createBudget: createMutation.mutateAsync,
    updateBudget: updateMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
  };
}
