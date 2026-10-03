import { TicketRepository } from '../repository/ticket.repository.js';
import { NotFoundError } from '../errors/app-error.js';
import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  ListQuery,
  ListTicketsResponse,
  TicketStats,
} from '@support-ticket/shared';

export type NowFn = () => string;

export class TicketService {
  private now: NowFn;

  constructor(
    private repo: TicketRepository,
    now?: NowFn
  ) {
    this.now = now || (() => new Date().toISOString());
  }

  createTicket(input: CreateTicketInput): Ticket {
    const timestamp = this.now();
    return this.repo.create(
      {
        title: input.title,
        description: input.description,
        customerEmail: input.customerEmail,
        priority: input.priority,
        status: input.status || 'Open',
      },
      {
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    );
  }

  getTicketById(id: number): Ticket {
    const ticket = this.repo.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  listTickets(query: ListQuery): ListTicketsResponse {
    const { tickets, total, totalPages } = this.repo.list(query);
    return {
      data: tickets,
      pagination: {
        page: query.page,
        pageSize: 10,
        total,
        totalPages,
      },
    };
  }

  updateTicket(id: number, input: UpdateTicketInput): Ticket {
    // Ensure ticket exists (throws NotFoundError if not found)
    this.getTicketById(id);

    const updatedAt = this.now();
    const updated = this.repo.updateStatusPriority(
      id,
      {
        status: input.status,
        priority: input.priority,
      },
      updatedAt
    );

    if (!updated) {
      throw new NotFoundError(`Ticket with id ${id} not found`);
    }
    return updated;
  }

  getStats(): TicketStats {
    return this.repo.stats();
  }
}
