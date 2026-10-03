import React from 'react';
import type { Pagination as PaginationMeta } from '@support-ticket/shared';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, total, totalPages } = meta;

  const displayTotalPages = totalPages === 0 ? 1 : totalPages;
  const isFirstPage = page <= 1;
  const isLastPage = page >= displayTotalPages;

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface border border-border rounded-lg"
      aria-label="Pagination Navigation"
    >
      {/* Total count summary */}
      <div className="text-xs sm:text-sm text-text-muted">
        Showing{' '}
        <span className="font-semibold text-text-primary">
          {total === 0 ? 0 : (page - 1) * meta.pageSize + 1}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-text-primary">
          {Math.min(page * meta.pageSize, total)}
        </span>{' '}
        of <span className="font-semibold text-text-primary">{total}</span> tickets
      </div>

      {/* Navigation buttons and page indicator */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-text-primary bg-surface-raised hover:bg-surface-overlay border border-border hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus min-h-[36px]"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Prev</span>
        </button>

        <span className="text-xs sm:text-sm font-medium text-text-secondary px-2" aria-current="page">
          Page {page} of {displayTotalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Go to next page"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-text-primary bg-surface-raised hover:bg-surface-overlay border border-border hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus min-h-[36px]"
        >
          <span>Next</span>
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
