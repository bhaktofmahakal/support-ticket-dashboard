import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { TicketStatus, TicketPriority } from '@support-ticket/shared';
import { useTicket } from '../hooks/useTicket.js';
import { apiClient, ApiError } from '../api/client.js';
import { ticketKeys } from '../hooks/ticketKeys.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge, PriorityBadge } from '../components/common/Badge.js';
import { formatDate } from '../components/tickets/TicketTable.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const ticketId = id ? parseInt(id, 10) : NaN;
  const isIdValid = !isNaN(ticketId) && ticketId > 0;

  const { data, isLoading, isError, error, refetch } = useTicket(ticketId);
  const ticket = data?.data;

  // Local state for inline status & priority dropdowns to allow optimistic/revert updates
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  // Sync ticket data when loaded
  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
      setSelectedPriority(ticket.priority);
      document.title = `#${ticket.id} - ${ticket.title} | SupportDesk`;
    } else {
      document.title = 'Ticket Details | SupportDesk';
    }
  }, [ticket]);

  // Back link preserves filter query from previous list state
  const returnUrl = (location.state as { fromListSearch?: string })?.fromListSearch
    ? `/${(location.state as { fromListSearch?: string }).fromListSearch}`
    : '/';

  // 1. Non-numeric or negative ID check
  if (!isIdValid) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
          ?
        </div>
        <h2 className="text-xl font-bold text-slate-900">Invalid Ticket ID</h2>
        <p className="text-sm text-slate-500 mt-1">
          The requested ticket ID is malformed or invalid.
        </p>
        <div className="mt-5">
          <Link
            to={returnUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Return to Tickets
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" aria-label="Loading ticket details...">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-24 bg-slate-100 rounded w-full mt-4" />
        </div>
      </div>
    );
  }

  // 3. 404 or Error State
  if (isError || !ticket) {
    const is404 = error instanceof ApiError ? error.status === 404 : false;

    if (is404) {
      return (
        <div className="max-w-xl mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 font-bold font-mono text-xl">
            404
          </div>
          <h2 className="text-xl font-bold text-slate-900">Ticket Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">
            Ticket #{ticketId} does not exist or may have been deleted.
          </p>
          <div className="mt-5">
            <Link
              to={returnUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Return to Tickets
            </Link>
          </div>
        </div>
      );
    }

    return (
      <ErrorMessage
        title="Failed to load ticket"
        message={error instanceof Error ? error.message : 'Could not fetch ticket details.'}
        onRetry={() => refetch()}
        className="max-w-2xl mx-auto my-8"
      />
    );
  }

  // Handle status update
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === ticket.status || isUpdatingStatus) return;

    const previousStatus = selectedStatus;
    setSelectedStatus(newStatus);
    setIsUpdatingStatus(true);

    try {
      const res = await apiClient.updateTicket(ticket.id, { status: newStatus });
      queryClient.setQueryData(ticketKeys.detail(ticket.id), res);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      showToast(`Status updated to "${newStatus}"`, 'success');
    } catch {
      // Rollback on failure
      setSelectedStatus(previousStatus);
      showToast('Failed to update status. Please try again.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle priority update
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (newPriority === ticket.priority || isUpdatingPriority) return;

    const previousPriority = selectedPriority;
    setSelectedPriority(newPriority);
    setIsUpdatingPriority(true);

    try {
      const res = await apiClient.updateTicket(ticket.id, { priority: newPriority });
      queryClient.setQueryData(ticketKeys.detail(ticket.id), res);
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
      showToast(`Priority updated to "${newPriority}"`, 'success');
    } catch {
      // Rollback on failure
      setSelectedPriority(previousPriority);
      showToast('Failed to update priority. Please try again.', 'error');
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation: Back Link */}
      <div>
        <Link
          to={returnUrl}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to tickets
        </Link>
      </div>

      {/* Main Ticket Card */}
      <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* Header Section */}
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span title={ticket.createdAt}>
                Created: <time dateTime={ticket.createdAt} className="font-medium text-slate-700">{formatDate(ticket.createdAt)}</time>
              </span>
              <span title={ticket.updatedAt}>
                Updated: <time dateTime={ticket.updatedAt} className="font-medium text-slate-700">{formatDate(ticket.updatedAt)}</time>
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {ticket.title}
          </h1>

          {/* Customer Metadata bar */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg px-3.5 py-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs text-slate-500 font-medium">Customer:</span>
            <a
              href={`mailto:${ticket.customerEmail}`}
              className="font-medium text-slate-800 hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              {ticket.customerEmail}
            </a>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-5 sm:p-7 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description
          </h2>
          <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
            {ticket.description}
          </div>
        </div>

        {/* Inline Triage Controls Section */}
        <div className="p-5 sm:p-7 bg-slate-50/50">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Ticket Management & Triage
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Selector */}
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <label
                htmlFor="update-status"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Change Status
              </label>
              <div className="relative">
                <select
                  id="update-status"
                  value={selectedStatus}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                {isUpdatingStatus && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
              <label
                htmlFor="update-priority"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                Change Priority
              </label>
              <div className="relative">
                <select
                  id="update-priority"
                  value={selectedPriority}
                  disabled={isUpdatingPriority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                {isUpdatingPriority && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
