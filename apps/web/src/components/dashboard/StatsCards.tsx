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
      textColor: 'text-slate-900',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
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
      textColor: 'text-blue-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-blue-50 text-blue-700',
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
      textColor: 'text-amber-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-amber-50 text-amber-700',
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
      textColor: 'text-emerald-700',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-emerald-50 text-emerald-700',
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
          className={`${card.bgColor} ${card.borderColor} border rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:shadow`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500">{card.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {card.icon}
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-2xl sm:text-3xl font-bold tracking-tight ${card.textColor}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
