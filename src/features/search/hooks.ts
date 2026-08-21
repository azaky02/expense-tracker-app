import { useQuery } from '@tanstack/react-query';

import { searchTransactions } from './api';

export function useSearchTransactions(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchTransactions(query),
    enabled: query.trim().length > 0,
  });
}
