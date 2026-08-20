import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCustomBank, listBanks } from './api';

const keys = { root: ['banks'] as const };

export function useBanks() {
  return useQuery({ queryKey: keys.root, queryFn: listBanks });
}

export function useCreateCustomBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createCustomBank(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
