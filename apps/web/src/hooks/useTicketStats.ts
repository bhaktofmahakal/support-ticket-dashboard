import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { ticketKeys } from './ticketKeys.js';

export function useTicketStats() {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: () => apiClient.getTicketStats(),
    staleTime: 15_000,
  });
}
