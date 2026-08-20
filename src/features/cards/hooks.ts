import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelCardNotifications, reconcileCardNotifications } from '@/lib/notifications/scheduler';

import { createCard, deactivateCard, getCard, listCards, updateCard } from './api';
import type { CardInput } from './types';

const keys = {
  root: ['cards'] as const,
  list: ['cards', 'list'] as const,
  detail: (id: string) => ['cards', 'detail', id] as const,
};

export function useCards() {
  return useQuery({ queryKey: keys.list, queryFn: listCards });
}

export function useCard(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getCard(id), enabled: !!id });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CardInput) => createCard(input),
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const card = await getCard(id);
      if (card) await reconcileCardNotifications(card);
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CardInput }) => updateCard(id, input),
    onSuccess: async (_result, { id }) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      const card = await getCard(id);
      if (card) await reconcileCardNotifications(card);
    },
  });
}

export function useDeactivateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCard(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: keys.root });
      await cancelCardNotifications(id);
    },
  });
}
