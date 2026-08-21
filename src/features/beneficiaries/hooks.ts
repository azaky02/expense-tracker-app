import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearDefaultBeneficiary, createBeneficiary, getDefaultBeneficiaryName, listBeneficiaries, listRecentBeneficiaries, setDefaultBeneficiary } from './api';

const keys = {
  root: ['beneficiaries'] as const,
  list: ['beneficiaries', 'list'] as const,
  defaultName: ['beneficiaries', 'default'] as const,
};

export function useRecentBeneficiaries(limit = 10) {
  return useQuery({ queryKey: ['beneficiaries', 'recent', limit], queryFn: () => listRecentBeneficiaries(limit) });
}

export function useBeneficiaries() {
  return useQuery({ queryKey: keys.list, queryFn: listBeneficiaries });
}

export function useDefaultBeneficiaryName() {
  return useQuery({ queryKey: keys.defaultName, queryFn: getDefaultBeneficiaryName });
}

export function useCreateBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createBeneficiary(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useSetDefaultBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultBeneficiary(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}

export function useClearDefaultBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clearDefaultBeneficiary(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
