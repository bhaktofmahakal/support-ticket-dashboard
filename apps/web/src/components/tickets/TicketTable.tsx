import React from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '@support-ticket/shared';
import { StatusBadge, PriorityBadge } from '../common/Badge.js';

interface TicketTableProps {
  tickets: Ticket[];
  rawQueryString: string;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function TicketTable({ tickets, rawQueryString }: TicketTableProps) {
  const returnQuery = rawQueryString ? `?${rawQueryString}` : '';

  return (
    <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th scope="col" className="px-4 py-3.5 w-16 text-center">
                ID
              </th>
              <th scope="col" className="px-4 py-3.5">
                Title
              </th>
              <th scope="col" className="px-4 py-3.5">
                Customer Email
              </th>
              <th scope="col" className="px-4 py-3.5 w-32">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5 w-28">
                Priority
              </th>
              <th scope="col" className="px-4 py-3.5 w-32 text-right">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {tickets.map((ticket) => {
              const detailUrl = `/tickets/${ticket.id}`;

              return (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-400">
                    #{ticket.id}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs xl:max-w-md">
                    <Link
                      to={detailUrl}
                      state={{ fromListSearch: returnQuery }}
                      className="block truncate text-slate-900 group-hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 truncate max-w-[200px]">
                    {ticket.customerEmail}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-xs text-slate-500 whitespace-nowrap"
                    title={ticket.createdAt}
                  >
                    {formatDate(ticket.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
