import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createPerson, listPeople, searchPeople } from './api';

const keys = {
  root: ['people'] as const,
  list: ['people', 'list'] as const,
  search: (query: string) => ['people', 'search', query] as const,
};

export function usePeople() {
  return useQuery({ queryKey: keys.list, queryFn: listPeople });
}

export function useSearchPeople(query: string) {
  return useQuery({ queryKey: keys.search(query), queryFn: () => searchPeople(query) });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPerson(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.root }),
  });
}
