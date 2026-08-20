import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCategoryBudget, setCategoryBudget } from './api';

const keys = {
  detail: (categoryId: string) => ['category-budgets', categoryId] as const,
};

export function useCategoryBudget(categoryId: string) {
  return useQuery({ queryKey: keys.detail(categoryId), queryFn: () => getCategoryBudget(categoryId) });
}

export function useSetCategoryBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, monthlyLimit, isEnabled }: { categoryId: string; monthlyLimit: number; isEnabled: boolean }) =>
      setCategoryBudget(categoryId, monthlyLimit, isEnabled),
    onSuccess: (_result, { categoryId }) => queryClient.invalidateQueries({ queryKey: keys.detail(categoryId) }),
  });
}
