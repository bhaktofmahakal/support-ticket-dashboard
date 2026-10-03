import type { ListQuery } from '@support-ticket/shared';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (query: Partial<ListQuery>) => [...ticketKeys.lists(), query] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
};
