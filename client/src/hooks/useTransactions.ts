import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateTransaction,
  apiDeleteTransaction,
  apiListTransactions,
  apiUpdateTransaction,
  type TransactionFilters,
  type TransactionInput,
} from "@/api/transactions";

export function useTransactions(filters: TransactionFilters) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => apiListTransactions(filters),
    placeholderData: (previousData) => previousData,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  const createMutation = useMutation({
    mutationFn: (input: TransactionInput) => apiCreateTransaction(input),
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) => apiUpdateTransaction(id, input),
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTransaction(id),
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  return {
    page: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
  };
}
