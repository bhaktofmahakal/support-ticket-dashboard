import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';

describe('Database, Seed & Migration Tests', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
  });

  afterEach(() => {
    db.close();
  });

  it('D1: seed inserts exactly 36 rows', () => {
    runMigrations(db);

    const seeded = seedDatabase(db);
    expect(seeded).toBe(36);

    const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
    expect(countRow.count).toBe(36);

    // Verify all 3 statuses are represented
    const statuses = db
      .prepare('SELECT DISTINCT status FROM tickets ORDER BY status')
      .all()
      .map((r: any) => r.status);
    expect(statuses).toEqual(['In Progress', 'Open', 'Resolved']);

    // Verify all 3 priorities are represented
    const priorities = db
      .prepare('SELECT DISTINCT priority FROM tickets ORDER BY priority')
      .all()
      .map((r: any) => r.priority);
    expect(priorities).toEqual(['High', 'Low', 'Medium']);

    // Verify 120-character title exists
    const title120Row = db
      .prepare('SELECT title FROM tickets WHERE length(title) = 120')
      .get() as { title: string } | undefined;
    expect(title120Row).toBeDefined();
    expect(title120Row!.title.length).toBe(120);
  });

  it('D2: running seed twice keeps 36 rows', () => {
    runMigrations(db);

    // First run
    const firstSeeded = seedDatabase(db);
    expect(firstSeeded).toBe(36);

    // Second run without reset: must be idempotent and skip insert
    const secondSeeded = seedDatabase(db);
    expect(secondSeeded).toBe(0);

    const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
    expect(countRow.count).toBe(36);
  });

  it('D3: migrations are idempotent', () => {
    // Run migrations once
    const firstRunApplied = runMigrations(db);
    expect(firstRunApplied.length).toBeGreaterThan(0);

    // Run migrations again on same database
    const secondRunApplied = runMigrations(db);
    expect(secondRunApplied).toEqual([]);

    // Check table still exists and functions properly
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tickets', 'schema_migrations')")
      .all();
    expect(tables).toHaveLength(2);
  });
});
