import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCustomBank, deleteBank, listBanks, renameBank } from './api';

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

export function useRenameBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameBank(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBank(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
