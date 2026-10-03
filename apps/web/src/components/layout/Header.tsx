import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  const isCreatePage = location.pathname === '/tickets/new';

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Product Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-text-primary group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus rounded-md p-1"
          >
            <div className="w-8 h-8 bg-surface-raised border border-border text-accent rounded-md flex items-center justify-center group-hover:border-border-strong transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-text-primary">
                SupportDesk
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded-full">
                Tickets
              </span>
            </div>
          </Link>

          {/* Action button */}
          <div className="flex items-center gap-3">
            {!isCreatePage && (
              <Link
                to="/tickets/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover active:bg-accent-focus rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus min-h-[40px]"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Ticket</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
