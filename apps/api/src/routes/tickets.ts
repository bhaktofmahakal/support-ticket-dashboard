import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  createTicketSchema,
  updateTicketSchema,
  querySchema,
  type CreateTicketInput,
  type UpdateTicketInput,
  type ListQuery,
} from '@support-ticket/shared';
import { validate } from '../middleware/validate.js';
import type { TicketService } from '../service/ticket.service.js';

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'Ticket ID must be a positive integer' })
    .int('Ticket ID must be an integer')
    .positive('Ticket ID must be a positive integer'),
});

export function createTicketsRouter(service: TicketService): Router {
  const router = Router();

  // 1. GET /stats MUST be registered before /:id to avoid route collision
  router.get('/tickets/stats', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = service.getStats();
      res.status(200).json({ data: stats });
    } catch (err) {
      next(err);
    }
  });

  // 2. POST /tickets
  router.post(
    '/tickets',
    validate({ body: createTicketSchema }),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = (res.locals.validated?.body || req.body) as CreateTicketInput;
        const ticket = service.createTicket(body);
        res.status(201).json({ data: ticket });
      } catch (err) {
        next(err);
      }
    }
  );

  // 3. GET /tickets
  router.get(
    '/tickets',
    validate({ query: querySchema }),
    (_req: Request, res: Response, next: NextFunction) => {
      try {
        const query = res.locals.validated?.query as ListQuery;
        const result = service.listTickets(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  // 4. GET /tickets/:id
  router.get(
    '/tickets/:id',
    validate({ params: idParamSchema }),
    (_req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = res.locals.validated?.params as { id: number };
        const ticket = service.getTicketById(id);
        res.status(200).json({ data: ticket });
      } catch (err) {
        next(err);
      }
    }
  );

  // 5. PATCH /tickets/:id
  router.patch(
    '/tickets/:id',
    validate({ params: idParamSchema, body: updateTicketSchema }),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = res.locals.validated?.params as { id: number };
        const body = (res.locals.validated?.body || req.body) as UpdateTicketInput;
        const updated = service.updateTicket(id, body);
        res.status(200).json({ data: updated });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
