import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('GET /api/tickets/stats - Stats Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  function insertTicket(status: 'Open' | 'In Progress' | 'Resolved') {
    const now = new Date().toISOString();
    return ctx.db
      .prepare(`
        INSERT INTO tickets (title, description, customer_email, status, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run('Ticket', 'Description', 'test@example.com', status, 'Medium', now, now);
  }

  it('S0: stats on an empty DB returns zeros', async () => {
    const res = await request(ctx.app).get('/api/tickets/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
      },
    });
  });

  it('S1: returns correct counts by status', async () => {
    // 3 Open, 2 In Progress, 4 Resolved = 9 total
    insertTicket('Open');
    insertTicket('Open');
    insertTicket('Open');
    insertTicket('In Progress');
    insertTicket('In Progress');
    insertTicket('Resolved');
    insertTicket('Resolved');
    insertTicket('Resolved');
    insertTicket('Resolved');

    const res = await request(ctx.app).get('/api/tickets/stats');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 9,
      open: 3,
      inProgress: 2,
      resolved: 4,
    });
  });

  it('S2: stats are independent of query params', async () => {
    insertTicket('Open');
    insertTicket('In Progress');
    insertTicket('Resolved');

    const res = await request(ctx.app).get(
      '/api/tickets/stats?status=Open&priority=High&search=critical'
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 3,
      open: 1,
      inProgress: 1,
      resolved: 1,
    });
  });

  it('S3: stats update after create and after PATCH', async () => {
    const initialRes = await request(ctx.app).get('/api/tickets/stats');
    expect(initialRes.body.data.total).toBe(0);

    // 1. Create a ticket (defaults to Open)
    const createRes = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'New incident reported',
        description: 'Outage on payment flow',
        customerEmail: 'ops@acme.com',
        priority: 'High',
      });
    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.data.id;

    const afterCreateRes = await request(ctx.app).get('/api/tickets/stats');
    expect(afterCreateRes.body.data).toEqual({
      total: 1,
      open: 1,
      inProgress: 0,
      resolved: 0,
    });

    // 2. PATCH status to In Progress
    await request(ctx.app)
      .patch(`/api/tickets/${ticketId}`)
      .send({ status: 'In Progress' });

    const afterProgressRes = await request(ctx.app).get('/api/tickets/stats');
    expect(afterProgressRes.body.data).toEqual({
      total: 1,
      open: 0,
      inProgress: 1,
      resolved: 0,
    });

    // 3. PATCH status to Resolved
    await request(ctx.app)
      .patch(`/api/tickets/${ticketId}`)
      .send({ status: 'Resolved' });

    const afterResolvedRes = await request(ctx.app).get('/api/tickets/stats');
    expect(afterResolvedRes.body.data).toEqual({
      total: 1,
      open: 0,
      inProgress: 0,
      resolved: 1,
    });
  });
});
