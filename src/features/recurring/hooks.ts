import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelRecurringRuleNotification, reconcileRecurringRuleNotification } from '@/lib/notifications/scheduler';

import { createRecurringRule, deactivateRecurringRule, deleteRecurringRule, getRecurringRule, listRecurringRules, updateRecurringRule } from './api';
import type { RecurringRuleInput } from './types';

const keys = {
  root: ['recurring'] as const,
  list: ['recurring', 'list'] as const,
  detail: (id: string) => ['recurring', 'detail', id] as const,
};

export function useRecurringRules() {
  return useQuery({ queryKey: keys.list, queryFn: listRecurringRules });
}

export function useRecurringRule(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getRecurringRule(id), enabled: !!id });
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringRuleInput) => createRecurringRule(input),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const rule = await getRecurringRule(id);
      if (rule) await reconcileRecurringRuleNotification(rule);
    },
  });
}

export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringRuleInput }) => updateRecurringRule(id, input),
    onSuccess: async (_result, { id }) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const rule = await getRecurringRule(id);
      if (rule) await reconcileRecurringRuleNotification(rule);
    },
  });
}

export function useDeactivateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateRecurringRule(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      await cancelRecurringRuleNotification(id);
    },
  });
}

export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurringRule(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      await cancelRecurringRuleNotification(id);
    },
  });
}
