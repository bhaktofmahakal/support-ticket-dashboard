import React from 'react';
import { useTicketStats } from '../../hooks/useTicketStats.js';
import { StatsSkeleton } from '../common/LoadingSkeleton.js';
import { ErrorMessage } from '../common/ErrorMessage.js';

export function StatsCards() {
  const { data, isLoading, isError, error, refetch } = useTicketStats();

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to load dashboard statistics"
        message={error instanceof Error ? error.message : 'Could not fetch ticket counts.'}
        onRetry={() => refetch()}
      />
    );
  }

  const stats = data?.data ?? { total: 0, open: 0, inProgress: 0, resolved: 0 };

  const cards = [
    {
      label: 'Total Tickets',
      value: stats.total,
      textColor: 'text-text-primary',
      iconBox: 'bg-surface-raised border border-border text-text-muted',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
    },
    {
      label: 'Open',
      value: stats.open,
      textColor: 'text-accent-hover',
      iconBox: 'bg-accent/10 border border-accent/20 text-accent',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      textColor: 'text-warning',
      iconBox: 'bg-warning-surface border border-warning-border text-warning',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      ),
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      textColor: 'text-success',
      iconBox: 'bg-success-surface border border-success-border text-success',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      aria-label="Summary statistics"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-border rounded-lg p-4 sm:p-5 transition-colors hover:border-border-strong"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-text-muted">{card.label}</span>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${card.iconBox}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {card.icon}
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-2xl sm:text-3xl font-semibold tracking-tight ${card.textColor}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
