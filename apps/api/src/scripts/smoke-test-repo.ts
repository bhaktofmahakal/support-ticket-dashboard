import Database from 'better-sqlite3';
import { runMigrations } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { TicketRepository } from '../repository/ticket.repository.js';
import { config } from '../config.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
}

export function runRepoSmokeTest(): void {
  console.log('--- Starting Repository Smoke Test ---');

  // 1. In-memory database with migrations
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  const applied = runMigrations(db, config.migrationsDir);
  assert(applied.length > 0, 'Migrations should apply to fresh DB');
  console.log('✓ Migrations applied successfully');

  // 2. Initial seed
  const seeded = seedDatabase(db);
  assert(seeded === 36, `Expected 36 tickets seeded, got ${seeded}`);
  console.log('✓ Initial seed inserted exactly 36 tickets');

  // 3. Idempotency check: running seed again with ifEmpty: true must keep 36
  const secondSeed = seedDatabase(db, { ifEmpty: true });
  assert(secondSeed === 0, 'Subsequent seed should skip insertion when table is non-empty');
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
  assert(countRow.count === 36, `Expected 36 tickets after idempotency check, got ${countRow.count}`);
  console.log('✓ Seed idempotency verified');

  // 4. Repository tests
  const repo = new TicketRepository(db);

  // Stats verification
  const stats = repo.stats();
  assert(stats.total === 36, `Total should be 36, got ${stats.total}`);
  assert(stats.open === 12, `Open should be 12, got ${stats.open}`);
  assert(stats.inProgress === 12, `In Progress should be 12, got ${stats.inProgress}`);
  assert(stats.resolved === 12, `Resolved should be 12, got ${stats.resolved}`);
  console.log('✓ Stats query matches expected distribution (12 Open, 12 In Progress, 12 Resolved)');

  // List: pagination
  const page1 = repo.list({ sort: 'newest', page: 1 });
  assert(page1.tickets.length === 10, `Page 1 should have 10 tickets, got ${page1.tickets.length}`);
  assert(page1.total === 36, `Total should be 36, got ${page1.total}`);
  assert(page1.totalPages === 4, `Total pages should be 4, got ${page1.totalPages}`);
  console.log('✓ Pagination metadata and 10 tickets/page verified');

  // List: search by title
  const ssoSearch = repo.list({ search: 'SSO', sort: 'newest', page: 1 });
  assert(ssoSearch.tickets.length > 0, 'Search for SSO should find matching tickets');
  assert(
    ssoSearch.tickets.every(
      (t) =>
        t.title.toLowerCase().includes('sso') ||
        t.customerEmail.toLowerCase().includes('sso')
    ),
    'All returned tickets must match search query'
  );
  console.log('✓ Search by title verified');

  // List: search by email
  const emailSearch = repo.list({ search: 'acme.corp', sort: 'newest', page: 1 });
  assert(emailSearch.tickets.length > 0, 'Search for acme.corp should return tickets');
  assert(
    emailSearch.tickets.every(
      (t) =>
        t.title.toLowerCase().includes('acme.corp') ||
        t.customerEmail.toLowerCase().includes('acme.corp')
    ),
    'All returned tickets must contain acme.corp'
  );
  console.log('✓ Search by customer email domain verified');

  // List: status filter
  const openOnly = repo.list({ status: 'Open', sort: 'newest', page: 1 });
  assert(openOnly.total === 12, `Expected 12 Open tickets total, got ${openOnly.total}`);
  assert(openOnly.tickets.every((t) => t.status === 'Open'), 'All results must be Open');
  console.log('✓ Status filter verified');

  // List: combined search + filter + priority + sort
  const combined = repo.list({
    search: 'globex',
    status: 'In Progress',
    priority: 'High',
    sort: 'newest',
    page: 1,
  });
  assert(
    combined.tickets.every(
      (t) =>
        t.status === 'In Progress' &&
        t.priority === 'High' &&
        (t.title.toLowerCase().includes('globex') || t.customerEmail.toLowerCase().includes('globex'))
    ),
    'Combined query returned matching tickets'
  );
  console.log('✓ Combined search + status + priority + sort query verified');

  // Wildcard escaping check: literal "%" search shouldn't match everything
  const literalPercent = repo.list({ search: '%', sort: 'newest', page: 1 });
  // In seed data, no ticket title contains "%" (some contain numbers, but not literal %)
  assert(
    literalPercent.total === 0 ||
      literalPercent.tickets.every(
        (t) => t.title.includes('%') || t.customerEmail.includes('%')
      ),
    'Wildcard % must be escaped'
  );
  console.log('✓ LIKE wildcard escaping verified');

  // Create & Update
  const newTicket = repo.create(
    {
      title: 'Smoke Test Ticket',
      description: 'Verifying repository create method',
      customerEmail: 'test@example.com',
      priority: 'Medium',
      status: 'Open',
    },
    {
      createdAt: '2026-10-03T12:00:00.000Z',
      updatedAt: '2026-10-03T12:00:00.000Z',
    }
  );
  assert(newTicket.id > 36, `New ticket ID should exceed 36, got ${newTicket.id}`);
  assert(newTicket.customerEmail === 'test@example.com', 'Email should match');

  const updatedTicket = repo.updateStatusPriority(
    newTicket.id,
    { status: 'Resolved', priority: 'High' },
    '2026-10-03T12:30:00.000Z'
  );
  assert(updatedTicket !== null, 'Updated ticket should not be null');
  assert(updatedTicket!.status === 'Resolved', 'Status should be Resolved');
  assert(updatedTicket!.priority === 'High', 'Priority should be High');
  assert(updatedTicket!.updatedAt === '2026-10-03T12:30:00.000Z', 'updatedAt should be updated');
  assert(updatedTicket!.createdAt === '2026-10-03T12:00:00.000Z', 'createdAt should be untouched');
  console.log('✓ Create and Update methods verified with timestamps');

  db.close();
  console.log('--- ALL REPOSITORY SMOKE TESTS PASSED ---');
}

runRepoSmokeTest();
