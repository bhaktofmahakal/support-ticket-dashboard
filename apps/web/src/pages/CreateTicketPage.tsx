import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createTicketSchema, type TicketPriority } from '@support-ticket/shared';
import { apiClient, ApiError } from '../api/client.js';
import { ticketKeys } from '../hooks/ticketKeys.js';
import { useToast } from '../context/ToastContext.js';

interface FormState {
  title: string;
  description: string;
  customerEmail: string;
  priority: TicketPriority;
}

interface FormErrors {
  title?: string;
  description?: string;
  customerEmail?: string;
  priority?: string;
  general?: string;
}

export function CreateTicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    customerEmail: '',
    priority: 'Medium',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return query from list page if user came from there
  const returnUrl = (location.state as { fromListSearch?: string })?.fromListSearch
    ? `/${(location.state as { fromListSearch?: string }).fromListSearch}`
    : '/';

  // Client-side validator for individual field or entire form
  const validateField = (field: keyof FormState, value: string): string | undefined => {
    const candidate = { ...form, [field]: value };
    const result = createTicketSchema.safeParse(candidate);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      return issue?.message;
    }
    return undefined;
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setTouched({
      title: true,
      description: true,
      customerEmail: true,
      priority: true,
    });

    // Full client-side schema validation
    const validationResult = createTicketSchema.safeParse(form);
    if (!validationResult.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiClient.createTicket(validationResult.data);
      const newTicket = res.data;

      // Invalidate list queries and stats so dashboard reflects the new ticket
      await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });

      showToast(`Ticket #${newTicket.id} created successfully!`, 'success');

      // Navigate immediately to the new ticket detail page
      navigate(`/tickets/${newTicket.id}`, {
        state: { fromListSearch: (location.state as { fromListSearch?: string })?.fromListSearch },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details && err.details.length > 0) {
          const serverFieldErrors: FormErrors = {};
          for (const item of err.details) {
            const f = item.field as keyof FormErrors;
            serverFieldErrors[f] = item.message;
          }
          setErrors(serverFieldErrors);
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: 'An unexpected network error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleLength = form.title.length;
  const isTitleOverLimit = titleLength > 120;
  const titleCounterColor = isTitleOverLimit
    ? 'text-rose-600 font-bold'
    : titleLength >= 110
    ? 'text-amber-600 font-semibold'
    : 'text-slate-400';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          to={returnUrl}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-0.5 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to tickets
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create New Ticket
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit a new customer support ticket to the triage queue.
        </p>
      </div>

      {/* General error alert */}
      {errors.general && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-2.5"
        >
          <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors.general}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-sm space-y-5"
      >
        {/* Title Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="ticket-title"
              className="block text-sm font-medium text-slate-800"
            >
              Title <span className="text-rose-500">*</span>
            </label>
            <span
              className={`text-xs ${titleCounterColor}`}
              aria-live="polite"
              aria-label={`${titleLength} of 120 maximum characters`}
            >
              {titleLength}/120
            </span>
          </div>
          <input
            id="ticket-title"
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="Brief summary of the issue (e.g. SSO login failure with Okta)"
            aria-describedby={errors.title ? 'title-error' : undefined}
            aria-invalid={Boolean(errors.title)}
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[42px] ${
              errors.title
                ? 'border-rose-400 bg-rose-50/30 focus-visible:ring-rose-500'
                : 'border-slate-300'
            }`}
          />
          {errors.title && (
            <p id="title-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.title}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="ticket-description"
            className="block text-sm font-medium text-slate-800 mb-1.5"
          >
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="ticket-description"
            rows={4}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Detailed description of the issue, symptoms, steps to reproduce..."
            aria-describedby={errors.description ? 'desc-error' : undefined}
            aria-invalid={Boolean(errors.description)}
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              errors.description
                ? 'border-rose-400 bg-rose-50/30 focus-visible:ring-rose-500'
                : 'border-slate-300'
            }`}
          />
          {errors.description && (
            <p id="desc-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.description}
            </p>
          )}
        </div>

        {/* Two Columns: Customer Email + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Email */}
          <div>
            <label
              htmlFor="ticket-email"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Customer Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-email"
              type="email"
              value={form.customerEmail}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
              onBlur={() => handleBlur('customerEmail')}
              placeholder="customer@company.com"
              aria-describedby={errors.customerEmail ? 'email-error' : undefined}
              aria-invalid={Boolean(errors.customerEmail)}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[42px] ${
                errors.customerEmail
                  ? 'border-rose-400 bg-rose-50/30 focus-visible:ring-rose-500'
                  : 'border-slate-300'
              }`}
            />
            {errors.customerEmail && (
              <p id="email-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.customerEmail}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="ticket-priority"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              id="ticket-priority"
              value={form.priority}
              onChange={(e) => handleChange('priority', e.target.value as TicketPriority)}
              onBlur={() => handleBlur('priority')}
              aria-describedby={errors.priority ? 'priority-error' : undefined}
              aria-invalid={Boolean(errors.priority)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[42px]"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.priority && (
              <p id="priority-error" className="mt-1.5 text-xs text-rose-600 font-medium">
                {errors.priority}
              </p>
            )}
          </div>
        </div>

        {/* Notice regarding default status */}
        <p className="text-xs text-slate-500 italic pt-1">
          * New tickets are automatically initialized with <strong className="text-slate-700">Open</strong> status.
        </p>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to={returnUrl}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[40px] flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 min-h-[40px]"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating Ticket...</span>
              </>
            ) : (
              <span>Create Ticket</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
