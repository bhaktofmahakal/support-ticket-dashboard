import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { getDatabase, closeDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

export function startServer() {
  // Ensure data directory exists before opening database
  if (config.databasePath !== ':memory:') {
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const db = getDatabase();

  console.log('[Server] Initializing database...');
  runMigrations(db);
  seedDatabase(db, { ifEmpty: true });

  const app = createApp({ db });

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[Server] API server running on http://0.0.0.0:${config.port}`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}. Closing server and database connection gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      closeDatabase();
      console.log('[Server] Database connection closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Could not close connections in time, forcefully shutting down');
      closeDatabase();
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  return server;
}

startServer();
