import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('GET /api/tickets - List & Query Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  function insertTicket(ticket: {
    title: string;
    description?: string;
    customerEmail?: string;
    status?: 'Open' | 'In Progress' | 'Resolved';
    priority?: 'Low' | 'Medium' | 'High';
    createdAt?: string;
    updatedAt?: string;
  }) {
    const now = new Date().toISOString();
    return ctx.db
      .prepare(`
        INSERT INTO tickets (title, description, customer_email, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        ticket.title,
        ticket.description ?? 'Test description',
        ticket.customerEmail ?? 'test@example.com',
        ticket.status ?? 'Open',
        ticket.priority ?? 'Medium',
        ticket.createdAt ?? now,
        ticket.updatedAt ?? now
      );
  }

  it('L1: returns paginated results with correct meta', async () => {
    for (let i = 1; i <= 15; i++) {
      insertTicket({ title: `Ticket #${i}` });
    }

    const res = await request(ctx.app).get('/api/tickets?page=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it('L2: search filters by title (case-insensitive)', async () => {
    insertTicket({ title: 'Database connection pool exhausted' });
    insertTicket({ title: 'Stripe webhook failure' });

    const res = await request(ctx.app).get('/api/tickets?search=DATABASE');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Database connection pool exhausted');
  });

  it('L3: search filters by customer email', async () => {
    insertTicket({ title: 'Bug 1', customerEmail: 'alice@acme.corp' });
    insertTicket({ title: 'Bug 2', customerEmail: 'bob@globex.com' });

    const res = await request(ctx.app).get('/api/tickets?search=acme.corp');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].customerEmail).toBe('alice@acme.corp');
  });

  it('L4: search + status filter combined', async () => {
    insertTicket({ title: 'OAuth error in login flow', status: 'Open' });
    insertTicket({ title: 'OAuth token refresh bug', status: 'Resolved' });
    insertTicket({ title: 'Billing error in invoice', status: 'Open' });

    const res = await request(ctx.app).get('/api/tickets?search=OAuth&status=Open');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('OAuth error in login flow');
    expect(res.body.data[0].status).toBe('Open');
  });

  it('L5: sort=newest returns descending order', async () => {
    insertTicket({ title: 'First', createdAt: '2026-09-01T10:00:00.000Z' });
    insertTicket({ title: 'Second', createdAt: '2026-09-02T10:00:00.000Z' });
    insertTicket({ title: 'Third', createdAt: '2026-09-03T10:00:00.000Z' });

    const res = await request(ctx.app).get('/api/tickets?sort=newest');
    expect(res.status).toBe(200);
    expect(res.body.data.map((t: { title: string }) => t.title)).toEqual([
      'Third',
      'Second',
      'First',
    ]);
  });

  it('L6: sort=oldest returns ascending order', async () => {
    insertTicket({ title: 'First', createdAt: '2026-09-01T10:00:00.000Z' });
    insertTicket({ title: 'Second', createdAt: '2026-09-02T10:00:00.000Z' });
    insertTicket({ title: 'Third', createdAt: '2026-09-03T10:00:00.000Z' });

    const res = await request(ctx.app).get('/api/tickets?sort=oldest');
    expect(res.status).toBe(200);
    expect(res.body.data.map((t: { title: string }) => t.title)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });

  it('L7: wildcard characters in search are escaped', async () => {
    insertTicket({ title: 'Special 100% discount not applying' });
    insertTicket({ title: 'Special 100 dollars credit missing' });
    insertTicket({ title: 'User_login failure event' });
    insertTicket({ title: 'User1login failure event' });

    // Literal % should match only the percent sign, not wildcards
    const percentRes = await request(ctx.app).get('/api/tickets?search=100%25');
    expect(percentRes.status).toBe(200);
    expect(percentRes.body.data).toHaveLength(1);
    expect(percentRes.body.data[0].title).toBe('Special 100% discount not applying');

    // Literal _ should match only underscore, not any character
    const underscoreRes = await request(ctx.app).get('/api/tickets?search=user_');
    expect(underscoreRes.status).toBe(200);
    expect(underscoreRes.body.data).toHaveLength(1);
    expect(underscoreRes.body.data[0].title).toBe('User_login failure event');
  });

  it('L8: stable sort across pages', async () => {
    // 15 tickets created with the exact same timestamp
    const duplicateTimestamp = '2026-09-15T12:00:00.000Z';
    for (let i = 1; i <= 15; i++) {
      insertTicket({ title: `Duplicate Time Ticket #${i}`, createdAt: duplicateTimestamp });
    }

    const page1Res = await request(ctx.app).get('/api/tickets?page=1&sort=newest');
    const page2Res = await request(ctx.app).get('/api/tickets?page=2&sort=newest');

    expect(page1Res.status).toBe(200);
    expect(page2Res.status).toBe(200);
    expect(page1Res.body.data).toHaveLength(10);
    expect(page2Res.body.data).toHaveLength(5);

    const idsPage1 = page1Res.body.data.map((t: { id: number }) => t.id);
    const idsPage2 = page2Res.body.data.map((t: { id: number }) => t.id);

    // No overlap between page 1 and page 2
    const commonIds = idsPage1.filter((id: number) => idsPage2.includes(id));
    expect(commonIds).toHaveLength(0);

    // Together they contain all 15 items
    const allIds = new Set([...idsPage1, ...idsPage2]);
    expect(allIds.size).toBe(15);
  });

  it('L9: out-of-range page returns empty data with correct totals', async () => {
    for (let i = 1; i <= 15; i++) {
      insertTicket({ title: `Ticket #${i}` });
    }

    const res = await request(ctx.app).get('/api/tickets?page=99');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toEqual({
      page: 99,
      pageSize: 10,
      total: 15,
      totalPages: 2,
    });
  });

  it('L10: page=0 returns 400', async () => {
    const res = await request(ctx.app).get('/api/tickets?page=0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'page' })])
    );
  });

  it('L11: page=abc returns 400', async () => {
    const res = await request(ctx.app).get('/api/tickets?page=abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'page' })])
    );
  });

  it('L12: status-only filter', async () => {
    insertTicket({ title: 'Open 1', status: 'Open' });
    insertTicket({ title: 'Open 2', status: 'Open' });
    insertTicket({ title: 'In Progress 1', status: 'In Progress' });
    insertTicket({ title: 'In Progress 2', status: 'In Progress' });
    insertTicket({ title: 'In Progress 3', status: 'In Progress' });
    insertTicket({ title: 'Resolved 1', status: 'Resolved' });

    const res = await request(ctx.app).get('/api/tickets?status=In%20Progress');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    for (const t of res.body.data) {
      expect(t.status).toBe('In Progress');
    }
  });

  it('L13: priority-only filter', async () => {
    insertTicket({ title: 'High 1', priority: 'High' });
    insertTicket({ title: 'High 2', priority: 'High' });
    insertTicket({ title: 'Medium 1', priority: 'Medium' });
    insertTicket({ title: 'Low 1', priority: 'Low' });

    const res = await request(ctx.app).get('/api/tickets?priority=High');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const t of res.body.data) {
      expect(t.priority).toBe('High');
    }
  });

  it('L14: search+status+priority+sort+page combined', async () => {
    insertTicket({
      title: 'Billing sync error with NetSuite',
      status: 'Open',
      priority: 'High',
      createdAt: '2026-09-01T12:00:00.000Z',
    });
    insertTicket({
      title: 'Billing export timeout',
      status: 'Open',
      priority: 'Low',
      createdAt: '2026-09-02T12:00:00.000Z',
    });
    insertTicket({
      title: 'Billing webhook retry failed',
      status: 'Resolved',
      priority: 'High',
      createdAt: '2026-09-03T12:00:00.000Z',
    });

    const res = await request(ctx.app).get(
      '/api/tickets?search=Billing&status=Open&priority=High&sort=newest&page=1'
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Billing sync error with NetSuite');
    expect(res.body.pagination.total).toBe(1);
  });

  it('L15: empty-string params treated as absent', async () => {
    insertTicket({ title: 'Ticket 1' });
    insertTicket({ title: 'Ticket 2' });

    const res = await request(ctx.app).get('/api/tickets?search=&status=&priority=');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('L16: whitespace-only search treated as absent', async () => {
    insertTicket({ title: 'Ticket 1' });
    insertTicket({ title: 'Ticket 2' });

    const res = await request(ctx.app).get('/api/tickets?search=%20%20%20');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
