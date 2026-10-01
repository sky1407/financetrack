import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateCategoryRule,
  apiDeleteCategoryRule,
  apiListCategoryRules,
  type CategoryRuleInput,
} from "@/api/categoryRules";

const RULES_KEY = ["category-rules"];

export function useCategoryRules() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: RULES_KEY, queryFn: apiListCategoryRules });

  const createMutation = useMutation({
    mutationFn: (input: CategoryRuleInput) => apiCreateCategoryRule(input),
    onSuccess: () => {
      // A new rule can move transactions between categories, which changes every derived view.
      for (const key of [RULES_KEY[0], "transactions", "dashboard", "budgets"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteCategoryRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });

  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    createRule: createMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
  };
}
