import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import type { TicketStatus, TicketPriority } from '@support-ticket/shared';

const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved'];
const VALID_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High'];
const VALID_SORTS = ['newest', 'oldest'] as const;

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') ?? '';

  const rawStatus = searchParams.get('status');
  const status: TicketStatus | '' =
    rawStatus && VALID_STATUSES.includes(rawStatus as TicketStatus)
      ? (rawStatus as TicketStatus)
      : '';

  const rawPriority = searchParams.get('priority');
  const priority: TicketPriority | '' =
    rawPriority && VALID_PRIORITIES.includes(rawPriority as TicketPriority)
      ? (rawPriority as TicketPriority)
      : '';

  const rawSort = searchParams.get('sort');
  const sort: 'newest' | 'oldest' =
    rawSort && (VALID_SORTS as readonly string[]).includes(rawSort)
      ? (rawSort as 'newest' | 'oldest')
      : 'newest';

  const rawPage = searchParams.get('page');
  const pageNum = rawPage ? parseInt(rawPage, 10) : 1;
  const page = !isNaN(pageNum) && pageNum >= 1 ? pageNum : 1;

  const setParams = useCallback(
    (updates: Record<string, string | number | undefined>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, val] of Object.entries(updates)) {
            if (
              val === undefined ||
              val === '' ||
              (key === 'page' && Number(val) === 1) ||
              (key === 'sort' && val === 'newest')
            ) {
              next.delete(key);
            } else {
              next.set(key, String(val));
            }
          }
          if (resetPage && !('page' in updates)) {
            next.delete('page');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setSearch = useCallback(
    (val: string) => {
      setParams({ search: val.trim() ? val : '' });
    },
    [setParams]
  );

  const setStatus = useCallback(
    (val: TicketStatus | '') => {
      setParams({ status: val });
    },
    [setParams]
  );

  const setPriority = useCallback(
    (val: TicketPriority | '') => {
      setParams({ priority: val });
    },
    [setParams]
  );

  const setSort = useCallback(
    (val: 'newest' | 'oldest') => {
      setParams({ sort: val });
    },
    [setParams]
  );

  const setPage = useCallback(
    (val: number) => {
      setParams({ page: val }, false);
    },
    [setParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        const currentSort = prev.get('sort');
        if (
          currentSort &&
          (VALID_SORTS as readonly string[]).includes(currentSort) &&
          currentSort !== 'newest'
        ) {
          next.set('sort', currentSort);
        }
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const hasActiveFilters = Boolean(search || status || priority);

  return {
    search,
    status,
    priority,
    sort,
    page,
    setSearch,
    setStatus,
    setPriority,
    setSort,
    setPage,
    clearFilters,
    hasActiveFilters,
    rawQueryString: searchParams.toString(),
  };
}
