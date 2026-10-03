import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
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
  webDistPath?: string;
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
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api', createTicketsRouter(service));

  // Catch-all for unknown /api routes (must be before SPA fallback)
  app.use('/api', notFoundHandler);

  // Static Assets and SPA Fallback (Production)
  const resolvedWebDistPath =
    deps.webDistPath ||
    process.env.WEB_DIST_PATH ||
    fileURLToPath(new URL('../../web/dist', import.meta.url));

  if (fs.existsSync(resolvedWebDistPath)) {
    app.use(express.static(resolvedWebDistPath));

    app.use((req, res, next) => {
      if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
        const indexPath = path.join(resolvedWebDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      next();
    });
  }

  // Catch-all for any other unmatched routes
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
