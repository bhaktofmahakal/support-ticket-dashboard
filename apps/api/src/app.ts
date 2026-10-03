import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type Database from 'better-sqlite3';
import { getDatabase } from './db/connection.js';
import { TicketRepository } from './repository/ticket.repository.js';
import { TicketService, type NowFn } from './service/ticket.service.js';
import { healthRouter } from './routes/health.js';
import { createTicketsRouter } from './routes/tickets.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export interface AppDependencies {
  db?: Database.Database;
  now?: NowFn;
}

export function createApp(deps: AppDependencies = {}): express.Application {
  const db = deps.db || getDatabase();
  const repo = new TicketRepository(db);
  const service = new TicketService(repo, deps.now);

  const app = express();

  // Basic security and parsing
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', createTicketsRouter(service));

  // Catch-all for unknown /api routes
  app.use('/api', notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
