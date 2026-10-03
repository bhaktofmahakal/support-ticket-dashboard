import React from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '@support-ticket/shared';
import { StatusBadge, PriorityBadge } from '../common/Badge.js';
import { formatDate } from './TicketTable.js';

interface TicketCardsProps {
  tickets: Ticket[];
  rawQueryString: string;
}

export function TicketCards({ tickets, rawQueryString }: TicketCardsProps) {
  const returnQuery = rawQueryString ? `?${rawQueryString}` : '';

  return (
    <div className="md:hidden space-y-3" aria-label="Tickets list for mobile">
      {tickets.map((ticket) => {
        const detailUrl = `/tickets/${ticket.id}`;

        return (
          <Link
            key={ticket.id}
            to={detailUrl}
            state={{ fromListSearch: returnQuery }}
            className="block p-4 bg-surface border border-border hover:border-border-strong rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
          >
            {/* Header: ID + Badges */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-medium text-text-muted">
                #{ticket.id}
              </span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={ticket.priority} size="sm" />
                <StatusBadge status={ticket.status} size="sm" />
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-text-primary line-clamp-2 text-sm sm:text-base leading-snug">
              {ticket.title}
            </h3>

            {/* Footer: Email + Timestamp */}
            <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-text-muted gap-2">
              <span className="truncate max-w-[200px] text-text-secondary" title={ticket.customerEmail}>
                {ticket.customerEmail}
              </span>
              <time dateTime={ticket.createdAt} title={ticket.createdAt} className="whitespace-nowrap flex-shrink-0 font-mono">
                {formatDate(ticket.createdAt)}
              </time>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
