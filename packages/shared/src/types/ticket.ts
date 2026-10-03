import { z } from 'zod';
import {
  ticketSchema,
  createTicketSchema,
  updateTicketSchema,
  querySchema,
  paginationSchema,
  errorResponseSchema,
  errorDetailSchema,
  ticketStatsSchema,
  statsResponseSchema,
} from '../schemas/ticket.js';

export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListQuery = z.infer<typeof querySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ErrorDetail = z.infer<typeof errorDetailSchema>;
export type TicketStats = z.infer<typeof ticketStatsSchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;

export interface ListTicketsResponse {
  data: Ticket[];
  pagination: Pagination;
}

export interface SingleTicketResponse {
  data: Ticket;
}
