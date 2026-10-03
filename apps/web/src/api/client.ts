import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  ListQuery,
  Pagination,
  TicketStats,
} from '@support-ticket/shared';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];

  constructor(status: number, message: string, code = 'INTERNAL_ERROR', details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Network error. Please check your connection.', 'NETWORK_ERROR');
  }

  if (!res.ok) {
    let errorData: { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | null = null;
    try {
      errorData = await res.json();
    } catch {
      // Non-JSON error payload
    }

    const message = errorData?.error?.message || `Request failed with status ${res.status}`;
    const code = errorData?.error?.code || 'INTERNAL_ERROR';
    const details = errorData?.error?.details;

    throw new ApiError(res.status, message, code, details);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  async getTickets(query: Partial<ListQuery> = {}): Promise<{ data: Ticket[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();

    if (query.search && query.search.trim().length > 0) {
      searchParams.set('search', query.search.trim());
    }
    if (query.status && query.status.trim().length > 0) {
      searchParams.set('status', query.status);
    }
    if (query.priority && query.priority.trim().length > 0) {
      searchParams.set('priority', query.priority);
    }
    if (query.sort) {
      searchParams.set('sort', query.sort);
    }
    if (query.page && query.page > 1) {
      searchParams.set('page', query.page.toString());
    }

    const queryString = searchParams.toString();
    const url = `/api/tickets${queryString ? `?${queryString}` : ''}`;
    return request<{ data: Ticket[]; pagination: Pagination }>(url);
  },

  async getTicketStats(): Promise<{ data: TicketStats }> {
    return request<{ data: TicketStats }>('/api/tickets/stats');
  },

  async getTicket(id: number): Promise<{ data: Ticket }> {
    return request<{ data: Ticket }>(`/api/tickets/${id}`);
  },

  async createTicket(input: CreateTicketInput): Promise<{ data: Ticket }> {
    return request<{ data: Ticket }>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateTicket(id: number, input: UpdateTicketInput): Promise<{ data: Ticket }> {
    return request<{ data: Ticket }>(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};
