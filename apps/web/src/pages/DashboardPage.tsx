import React, { useEffect } from 'react';
import { useUrlState } from '../hooks/useUrlState.js';
import { useTickets } from '../hooks/useTickets.js';
import { StatsCards } from '../components/dashboard/StatsCards.js';
import { TicketFilterBar } from '../components/tickets/TicketFilterBar.js';
import { TicketTable } from '../components/tickets/TicketTable.js';
import { TicketCards } from '../components/tickets/TicketCards.js';
import { Pagination } from '../components/tickets/Pagination.js';
import { EmptyState } from '../components/tickets/EmptyState.js';
import { TableSkeleton } from '../components/common/LoadingSkeleton.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';

export function DashboardPage() {
  useEffect(() => {
    document.title = 'Tickets Overview | SupportDesk';
  }, []);
  const {
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
    rawQueryString,
  } = useUrlState();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTickets({
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sort,
    page,
  });

  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* 1. Header description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tickets Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor, filter, and manage incoming support inquiries.
          </p>
        </div>
        {isFetching && !isLoading && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-full self-start sm:self-auto animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
            Updating tickets...
          </div>
        )}
      </div>

      {/* 2. Summary stats cards */}
      <StatsCards />

      {/* 3. Filters & search bar */}
      <TicketFilterBar
        search={search}
        status={status}
        priority={priority}
        sort={sort}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onSortChange={setSort}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Ticket content area */}
      <section aria-label="Ticket listings" className="space-y-4">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorMessage
            title="Failed to load tickets"
            message={
              error instanceof Error
                ? error.message
                : 'Unable to communicate with the ticket service.'
            }
            onRetry={() => refetch()}
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            isFiltered={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <TicketTable tickets={tickets} rawQueryString={rawQueryString} />

            {/* Mobile Stacked Card View */}
            <TicketCards tickets={tickets} rawQueryString={rawQueryString} />

            {/* Pagination Controls */}
            {pagination && (
              <Pagination meta={pagination} onPageChange={setPage} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
