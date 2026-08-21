import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTransfer, listTransfers } from './api';
import type { TransferInput } from './types';

const keys = {
  root: ['transfers'] as const,
  list: ['transfers', 'list'] as const,
};

export function useTransfers() {
  return useQuery({ queryKey: keys.list, queryFn: listTransfers });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) => createTransfer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.root });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
