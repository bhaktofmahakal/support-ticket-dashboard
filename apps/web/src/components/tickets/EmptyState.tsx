import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ isFiltered, onClearFilters }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="bg-surface rounded-lg border border-border p-8 text-center">
        <div className="w-12 h-12 bg-surface-raised text-text-muted rounded-full flex items-center justify-center mx-auto mb-3 border border-border">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-text-primary">No matching tickets</h3>
        <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
          We couldn&apos;t find any tickets matching your search query or filter selection.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-primary bg-surface-raised hover:bg-surface-overlay border border-border-strong rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-10 text-center">
      <div className="w-14 h-14 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-3.5 border border-accent/20">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary">No tickets yet</h3>
      <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
        Your support desk queue is currently empty. Get started by submitting a new ticket.
      </p>
      <div className="mt-5">
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create First Ticket
        </Link>
      </div>
    </div>
  );
}
