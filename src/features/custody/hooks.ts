import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCustodyRecord,
  deleteCustodyRecord,
  getCustodyRecord,
  getTotalCustodyBalance,
  listOpenCustodyRecords,
  listSettlements,
  settleCustody,
  updateCustodyRecord,
} from './api';
import type { CustodyRecordInput } from './types';

const keys = {
  root: ['custody'] as const,
  open: ['custody', 'open'] as const,
  total: ['custody', 'total'] as const,
  detail: (id: string) => ['custody', 'detail', id] as const,
  settlements: (id: string) => ['custody', 'settlements', id] as const,
};

export function useOpenCustodyRecords() {
  return useQuery({ queryKey: keys.open, queryFn: listOpenCustodyRecords });
}

export function useTotalCustodyBalance() {
  return useQuery({ queryKey: keys.total, queryFn: getTotalCustodyBalance });
}

export function useCustodyRecord(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getCustodyRecord(id), enabled: !!id });
}

export function useCustodySettlements(id: string) {
  return useQuery({ queryKey: keys.settlements(id), queryFn: () => listSettlements(id), enabled: !!id });
}

export function useCreateCustodyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustodyRecordInput) => createCustodyRecord(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useUpdateCustodyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, originalAmount }: { id: string; reason?: string | null; originalAmount: number }) =>
      updateCustodyRecord(id, { reason, originalAmount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useDeleteCustodyRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustodyRecord(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useSettleCustody() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, date, note }: { id: string; amount: number; date: string; note?: string | null }) =>
      settleCustody(id, amount, date, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
