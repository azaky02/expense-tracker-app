import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelAccountNotifications, reconcileAccountNotifications } from '@/lib/notifications/scheduler';

import { createAccount, deactivateAccount, getAccount, listAccounts, listAccountsWithBalances, updateAccount } from './api';
import type { AccountInput } from './types';

const keys = {
  root: ['accounts'] as const,
  list: ['accounts', 'list'] as const,
  withBalances: (monthStart: string, monthEnd: string) => ['accounts', 'withBalances', monthStart, monthEnd] as const,
  detail: (id: string) => ['accounts', 'detail', id] as const,
};

export function useAccounts() {
  return useQuery({ queryKey: keys.list, queryFn: listAccounts });
}

export function useAccountsWithBalances(monthStart: string, monthEnd: string) {
  return useQuery({ queryKey: keys.withBalances(monthStart, monthEnd), queryFn: () => listAccountsWithBalances(monthStart, monthEnd) });
}

export function useAccount(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getAccount(id), enabled: !!id });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => createAccount(input),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const account = await getAccount(id);
      if (account) await reconcileAccountNotifications(account);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) => updateAccount(id, input),
    onSuccess: async (_result, { id }) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const account = await getAccount(id);
      if (account) await reconcileAccountNotifications(account);
    },
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateAccount(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      await cancelAccountNotifications(id);
    },
  });
}
