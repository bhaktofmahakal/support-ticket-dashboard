import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('PATCH /api/tickets/:id - Update Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext('2026-09-01T12:00:00.000Z');
  });

  afterEach(() => {
    ctx.db.close();
  });

  async function createInitialTicket() {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Initial support ticket',
        description: 'Initial description',
        customerEmail: 'customer@example.com',
        priority: 'Low',
        status: 'Open',
      });
    return res.body.data;
  }

  it('U1: updates status successfully', async () => {
    const initial = await createInitialTicket();

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Resolved');

    // Persistence check via fresh GET
    const getRes = await request(ctx.app).get(`/api/tickets/${initial.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('Resolved');
  });

  it('U2: updates priority successfully', async () => {
    const initial = await createInitialTicket();

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({ priority: 'High' });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('High');

    // Persistence check via fresh GET
    const getRes = await request(ctx.app).get(`/api/tickets/${initial.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.priority).toBe('High');
  });

  it('U3: updated_at changes on PATCH', async () => {
    const initial = await createInitialTicket();
    expect(initial.createdAt).toBe('2026-09-01T12:00:00.000Z');
    expect(initial.updatedAt).toBe('2026-09-01T12:00:00.000Z');

    // Advance injectable clock
    ctx.setNow('2026-09-01T12:15:30.000Z');

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.updatedAt).toBe('2026-09-01T12:15:30.000Z');
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(
      new Date(initial.updatedAt).getTime()
    );
  });

  it('U4: created_at does NOT change on PATCH', async () => {
    const initial = await createInitialTicket();

    // Advance clock
    ctx.setNow('2026-09-05T08:00:00.000Z');

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({ priority: 'Medium' });

    expect(res.status).toBe(200);
    expect(res.body.data.createdAt).toBe(initial.createdAt);
  });

  it('U5: rejects unknown fields', async () => {
    const initial = await createInitialTicket();

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({
        status: 'Resolved',
        title: 'New unauthorized title update',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/unknown fields/i);
  });

  it('U6: rejects empty body', async () => {
    const initial = await createInitialTicket();

    // 1. Empty JSON object
    const emptyJsonRes = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({});

    expect(emptyJsonRes.status).toBe(400);
    expect(emptyJsonRes.body.error.code).toBe('VALIDATION_ERROR');

    // 2. Request without payload
    const noBodyRes = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .set('Content-Type', 'application/json');

    expect(noBodyRes.status).toBe(400);
    expect(noBodyRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('U7: returns 404 for non-existent ticket', async () => {
    const res = await request(ctx.app)
      .patch('/api/tickets/99999')
      .send({ status: 'Resolved' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('U8: invalid enum on PATCH -> 400', async () => {
    const initial = await createInitialTicket();

    const res = await request(ctx.app)
      .patch(`/api/tickets/${initial.id}`)
      .send({ status: 'Done' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('U9: invalid id on PATCH -> 400', async () => {
    const res1 = await request(ctx.app)
      .patch('/api/tickets/abc')
      .send({ status: 'Resolved' });

    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    const res2 = await request(ctx.app)
      .patch('/api/tickets/-5')
      .send({ status: 'Resolved' });

    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });
});
