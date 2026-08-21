import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createGoal, deactivateGoal, getGoalWithProgress, listGoalsWithProgress } from './api';
import type { GoalInput } from './types';

const keys = {
  root: ['goals'] as const,
  list: ['goals', 'list'] as const,
  detail: (id: string) => ['goals', 'detail', id] as const,
};

export function useGoals() {
  return useQuery({ queryKey: keys.list, queryFn: listGoalsWithProgress });
}

export function useGoal(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getGoalWithProgress(id), enabled: !!id });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => createGoal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useDeactivateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
