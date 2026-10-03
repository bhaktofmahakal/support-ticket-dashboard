import React from 'react';
import type { TicketStatus, TicketPriority } from '@support-ticket/shared';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let iconElement: React.ReactNode = null;

  switch (status) {
    case 'Open':
      colorClasses = 'bg-accent/15 text-accent-hover border-accent/30';
      iconElement = (
        <span
          className="w-1.5 h-1.5 rounded-full border border-current flex-shrink-0"
          aria-hidden="true"
        />
      );
      break;
    case 'In Progress':
      colorClasses = 'bg-warning-surface text-warning border-warning-border';
      iconElement = (
        <span
          className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse flex-shrink-0"
          aria-hidden="true"
        />
      );
      break;
    case 'Resolved':
      colorClasses = 'bg-success-surface text-success border-success-border';
      iconElement = (
        <svg
          className="w-3 h-3 text-success flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${sizeClasses} ${colorClasses}`}
    >
      {iconElement}
      <span>{status}</span>
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let iconElement: React.ReactNode = null;

  switch (priority) {
    case 'High':
      colorClasses = 'bg-danger-surface text-danger border-danger-border font-semibold';
      iconElement = (
        <svg
          className="w-3 h-3 text-danger flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 4l9 16H3l9-16z" />
        </svg>
      );
      break;
    case 'Medium':
      colorClasses = 'bg-warning-surface text-warning border-warning-border font-medium';
      iconElement = (
        <svg
          className="w-3 h-3 text-warning flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4 9h16v2H4V9zm0 4h16v2H4v-2z" />
        </svg>
      );
      break;
    case 'Low':
      colorClasses = 'bg-surface-raised text-text-secondary border-border font-normal';
      iconElement = (
        <svg
          className="w-3 h-3 text-text-muted flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-xs ${sizeClasses} ${colorClasses}`}
    >
      {iconElement}
      <span>{priority}</span>
    </span>
  );
}
