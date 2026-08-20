import { useQuery } from '@tanstack/react-query';

import { listRecentBeneficiaries } from './api';

export function useRecentBeneficiaries(limit = 10) {
  return useQuery({ queryKey: ['beneficiaries', 'recent', limit], queryFn: () => listRecentBeneficiaries(limit) });
}
