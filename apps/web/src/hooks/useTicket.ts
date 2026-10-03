import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { ticketKeys } from './ticketKeys.js';

export function useTicket(id: number) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => apiClient.getTicket(id),
    enabled: !isNaN(id) && id > 0,
    staleTime: 10_000,
    retry: (failureCount, error: any) => {
      // Don't retry 404s
      if (error?.status === 404) return false;
      return failureCount < 1;
    },
  });
}
