import { useQuery } from '@tanstack/react-query';

import { getCashFlowForecast } from './api';

export function useCashFlowForecast() {
  return useQuery({ queryKey: ['forecast', 'cashflow'], queryFn: getCashFlowForecast });
}
