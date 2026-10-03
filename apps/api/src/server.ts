import { config } from './config.js';
import { getDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

export function startServer() {
  const db = getDatabase();

  console.log('[Server] Initializing database...');
  runMigrations(db);
  seedDatabase(db, { ifEmpty: true });

  const app = createApp({ db });

  const server = app.listen(config.port, () => {
    console.log(`[Server] API server running on http://localhost:${config.port}`);
  });

  return server;
}

startServer();
