import { useQuery } from '@tanstack/react-query';

import { getUpcomingPayments } from './api';

export function useUpcomingPayments(daysAhead = 30) {
  return useQuery({ queryKey: ['bills', 'upcoming', daysAhead], queryFn: () => getUpcomingPayments(daysAhead) });
}
