import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { ticketKeys } from './ticketKeys.js';
import type { ListQuery } from '@support-ticket/shared';

export function useTickets(query: Partial<ListQuery>) {
  return useQuery({
    queryKey: ticketKeys.list(query),
    queryFn: () => apiClient.getTickets(query),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
