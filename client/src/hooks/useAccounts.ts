import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiCreateAccount, apiDeleteAccount, apiListAccounts, apiUpdateAccount, type AccountInput } from "@/api/accounts";

const ACCOUNTS_KEY = ["accounts"];

export function useAccounts() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ACCOUNTS_KEY, queryFn: apiListAccounts });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
  }

  const createMutation = useMutation({
    mutationFn: (input: AccountInput) => apiCreateAccount(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AccountInput> }) => apiUpdateAccount(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteAccount(id),
    onSuccess: invalidate,
  });

  return {
    accounts: query.data ?? [],
    isLoading: query.isLoading,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
  };
}
