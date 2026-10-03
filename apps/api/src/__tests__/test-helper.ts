import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrate.js';
import { createApp } from '../app.js';
import type { Application } from 'express';

export interface TestContext {
  db: Database.Database;
  app: Application;
  setNow: (iso: string) => void;
  getNow: () => string;
}

export function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  runMigrations(db);
  return db;
}

export function createTestContext(initialNow?: string): TestContext {
  const db = createTestDatabase();
  let currentNow = initialNow ?? new Date().toISOString();

  const nowFn = () => currentNow;
  const app = createApp({ db, now: nowFn });

  return {
    db,
    app,
    setNow: (iso: string) => {
      currentNow = iso;
    },
    getNow: () => currentNow,
  };
}
