import React, { useState, useEffect } from 'react';
import type { TicketStatus, TicketPriority } from '@support-ticket/shared';

interface TicketFilterBarProps {
  search: string;
  status: TicketStatus | '';
  priority: TicketPriority | '';
  sort: 'newest' | 'oldest';
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TicketStatus | '') => void;
  onPriorityChange: (priority: TicketPriority | '') => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function TicketFilterBar({
  search,
  status,
  priority,
  sort,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: TicketFilterBarProps) {
  // Local search state for immediate UI feedback while typing
  const [localSearch, setLocalSearch] = useState(search);

  // Sync external search change (e.g. from URL or clear filters)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search update to parent URL state (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input (5 cols on lg) */}
        <div className="lg:col-span-5 relative">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets by title or customer email
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="ticket-search"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by title or email..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 min-h-[40px]"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search text"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-r-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Filter (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="ticket-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="ticket-status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TicketStatus | '')}
            className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[40px]"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Priority Filter (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="ticket-priority-filter" className="sr-only">
            Filter by priority
          </label>
          <select
            id="ticket-priority-filter"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as TicketPriority | '')}
            className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[40px]"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort select (2 cols on lg) */}
        <div className="lg:col-span-2">
          <label htmlFor="ticket-sort" className="sr-only">
            Sort tickets
          </label>
          <select
            id="ticket-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
            className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[40px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Clear filters CTA (1 col on lg or span full) */}
        <div className="lg:col-span-1 flex items-center justify-end">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[40px]"
              title="Clear all active filters"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
