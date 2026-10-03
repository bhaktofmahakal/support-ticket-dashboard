import React from 'react';
import type { TicketStatus, TicketPriority } from '@support-ticket/shared';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = '';
  let dotClass = '';

  switch (status) {
    case 'Open':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      dotClass = 'bg-blue-500';
      break;
    case 'In Progress':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClass = 'bg-amber-500 animate-pulse';
      break;
    case 'Resolved':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${sizeClasses} ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {status}
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

  switch (priority) {
    case 'High':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      break;
    case 'Medium':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
      break;
    case 'Low':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 font-normal';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md ${sizeClasses} ${colorClasses}`}
    >
      {priority}
    </span>
  );
}
