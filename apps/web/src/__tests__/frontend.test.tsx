import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext.js';
import { CreateTicketPage } from '../pages/CreateTicketPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { StatsCards } from '../components/dashboard/StatsCards.js';
import { apiClient } from '../api/client.js';
import type { TicketStats } from '@support-ticket/shared';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter
            initialEntries={initialEntries}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/" element={ui} />
              <Route path="/tickets/new" element={ui} />
              <Route path="/tickets/:id" element={ui} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

describe('Frontend Component & Page Tests (F1 - F8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // F1: form shows validation errors for invalid input
  it('F1: form shows validation errors for invalid input', async () => {
    renderWithProviders(<CreateTicketPage />, { initialEntries: ['/tickets/new'] });

    const submitBtn = screen.getByRole('button', { name: /create ticket/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/title is required and must not be empty/i)).toBeDefined();
    expect(await screen.findByText(/description is required and must not be empty/i)).toBeDefined();
    expect(await screen.findByText(/invalid email format/i)).toBeDefined();
  });

  // F2: form disables submit while pending
  it('F2: form disables submit while pending', async () => {
    let resolvePromise: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(apiClient, 'createTicket').mockImplementation(() => pendingPromise as any);

    renderWithProviders(<CreateTicketPage />, { initialEntries: ['/tickets/new'] });

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Valid Ticket Title' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Valid Ticket Description' },
    });
    fireEvent.change(screen.getByLabelText(/customer email/i), {
      target: { value: 'customer@example.com' },
    });

    const submitBtn = screen.getByRole('button', { name: /create ticket/i });
    fireEvent.click(submitBtn);

    // Button should be disabled and show loading text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating ticket\.\.\./i })).toBeDefined();
      expect(submitBtn).toHaveProperty('disabled', true);
    });

    // Cleanup
    await act(async () => {
      resolvePromise!({
        data: {
          id: 99,
          title: 'Valid Ticket Title',
          description: 'Valid Ticket Description',
          customerEmail: 'customer@example.com',
          status: 'Open',
          priority: 'Medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });
  });

  // F3: list renders loading skeleton
  it('F3: list renders loading skeleton', () => {
    vi.spyOn(apiClient, 'getTickets').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({
      data: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByLabelText(/loading tickets\.\.\./i)).toBeDefined();
  });

  // F4: list renders empty state when no tickets
  it('F4: list renders empty state when no tickets', async () => {
    vi.spyOn(apiClient, 'getTickets').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });
    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({
      data: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    });

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole('heading', { name: /no tickets yet/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /create first ticket/i })).toBeDefined();
  });

  // F5: stats cards render correct counts
  it('F5: stats cards render correct counts', async () => {
    const mockStats: TicketStats = {
      total: 42,
      open: 14,
      inProgress: 12,
      resolved: 16,
    };

    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({ data: mockStats });

    renderWithProviders(<StatsCards />);

    expect(await screen.findByText('42')).toBeDefined();
    expect(await screen.findByText('14')).toBeDefined();
    expect(await screen.findByText('12')).toBeDefined();
    expect(await screen.findByText('16')).toBeDefined();
  });

  // F6: changing a filter writes URL params and resets page to 1
  it('F6: changing a filter writes URL params and resets page to 1', async () => {
    vi.spyOn(apiClient, 'getTickets').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });
    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({
      data: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    });

    renderWithProviders(<DashboardPage />, { initialEntries: ['/?page=3'] });

    const statusSelect = await screen.findByLabelText(/filter by status/i);
    fireEvent.change(statusSelect, { target: { value: 'Open' } });

    // Status filter changes should query API with status Open and reset page to default (1)
    await waitFor(() => {
      expect(apiClient.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Open' })
      );
    });
  });

  // F7: no-match state shows Clear filters
  it('F7: no-match state shows Clear filters', async () => {
    vi.spyOn(apiClient, 'getTickets').mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });
    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({
      data: { total: 10, open: 5, inProgress: 3, resolved: 2 },
    });

    renderWithProviders(<DashboardPage />, { initialEntries: ['/?search=nomatchquery'] });

    expect(await screen.findByRole('heading', { name: /no matching tickets/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeDefined();
  });

  // F8: error state shows Retry
  it('F8: error state shows Retry', async () => {
    const errorMock = vi
      .spyOn(apiClient, 'getTickets')
      .mockRejectedValue(new Error('Backend server is down'));

    vi.spyOn(apiClient, 'getTicketStats').mockResolvedValue({
      data: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    });

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/failed to load tickets/i)).toBeDefined();
    expect(screen.getByText(/backend server is down/i)).toBeDefined();

    // Now mock resolves on retry
    errorMock.mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledTimes(2); // 1 initial + 1 on manual retry
    });
  });
});
