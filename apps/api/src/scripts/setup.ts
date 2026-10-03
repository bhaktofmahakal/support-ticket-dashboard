import { getDatabase, closeDatabase } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';

export function runSetup(options: { reset?: boolean } = {}): void {
  const db = getDatabase();
  console.log('[Setup] Running database migrations...');
  runMigrations(db);

  console.log('[Setup] Checking seed data...');
  seedDatabase(db, { ifEmpty: !options.reset, reset: options.reset });

  console.log('[Setup] Database setup complete.');
}

if (process.argv[1] && process.argv[1].includes('setup')) {
  try {
    const isReset = process.argv.includes('--reset');
    runSetup({ reset: isReset });
    closeDatabase();
    process.exit(0);
  } catch (err) {
    console.error('[Setup] Setup failed:', err);
    closeDatabase();
    process.exit(1);
  }
}
