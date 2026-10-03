import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In src/ or dist/, API_ROOT points to apps/api/
export const API_ROOT = path.resolve(__dirname, '..');

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.resolve(process.cwd(), 'data/tickets.db'),
  migrationsDir: process.env.MIGRATIONS_DIR
    ? path.resolve(process.cwd(), process.env.MIGRATIONS_DIR)
    : path.resolve(API_ROOT, 'migrations'),
};
