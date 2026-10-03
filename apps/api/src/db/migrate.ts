import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { config } from '../config.js';
import { getDatabase } from './connection.js';

export function runMigrations(
  db: Database.Database = getDatabase(),
  migrationsDir: string = config.migrationsDir
): string[] {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  // 1. Create schema_migrations tracker table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z')
    );
  `);

  // 2. Query already applied migrations
  const appliedRows = db
    .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
    .all() as { version: string }[];
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  // 3. Read and sort migration files
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const newlyApplied: string[] = [];

  const applyMigration = db.transaction((file: string, sql: string) => {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
  });

  for (const file of files) {
    if (!appliedSet.has(file)) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      applyMigration(file, sql);
      newlyApplied.push(file);
      console.log(`[Migrations] Applied: ${file}`);
    }
  }

  if (newlyApplied.length === 0) {
    console.log('[Migrations] Database is up to date.');
  }

  return newlyApplied;
}

// Direct CLI invocation
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const applied = runMigrations();
    console.log(`[Migrations] Finished. ${applied.length} new migration(s) applied.`);
  } catch (err) {
    console.error('[Migrations] Failed to run migrations:', err);
    process.exit(1);
  }
}
