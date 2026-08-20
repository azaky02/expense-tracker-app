import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCategory, deleteCategory, listCategories, listCategoryTree, updateCategory, type CategoryInput } from './api';

const keys = {
  root: ['categories'] as const,
  list: (type?: 'Expense' | 'Income') => ['categories', 'list', type ?? 'all'] as const,
  tree: (type?: 'Expense' | 'Income') => ['categories', 'tree', type ?? 'all'] as const,
};

export function useCategories(type?: 'Expense' | 'Income') {
  return useQuery({ queryKey: keys.list(type), queryFn: () => listCategories(type) });
}

export function useCategoryTree(type?: 'Expense' | 'Income') {
  return useQuery({ queryKey: keys.tree(type), queryFn: () => listCategoryTree(type) });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Omit<CategoryInput, 'parentCategoryId'> }) => updateCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
