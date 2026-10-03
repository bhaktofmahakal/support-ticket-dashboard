import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('POST /api/tickets - Validation Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('V1: rejects empty title', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: '',
        description: 'Valid description for the ticket',
        customerEmail: 'user@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })])
    );
  });

  it('V2: rejects whitespace-only title', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: '    \t   \n  ',
        description: 'Valid description for the ticket',
        customerEmail: 'user@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })])
    );
  });

  it('V3: accepts 120-char title', async () => {
    const title120 = 'A'.repeat(120);
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: title120,
        description: 'Valid description for the ticket',
        customerEmail: 'user@example.com',
        priority: 'Medium',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe(title120);
    expect(res.body.data.title.length).toBe(120);
  });

  it('V4: rejects 121-char title', async () => {
    const title121 = 'A'.repeat(121);
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: title121,
        description: 'Valid description for the ticket',
        customerEmail: 'user@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'title',
          message: expect.stringMatching(/120/),
        }),
      ])
    );
  });

  it('V5: rejects empty description', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: '',
        customerEmail: 'user@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'description' })])
    );
  });

  it('V6: rejects whitespace-only description', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: '   \n  \t ',
        customerEmail: 'user@example.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'description' })])
    );
  });

  it('V7: rejects invalid email', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: 'Valid description',
        customerEmail: 'not-an-email@',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'customerEmail' })])
    );
  });

  it('V8: lowercases email on create', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: 'Valid description',
        customerEmail: 'User.Name+Tag@Example.COM',
        priority: 'Medium',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.customerEmail).toBe('user.name+tag@example.com');

    // Check DB persistence
    const row = ctx.db
      .prepare('SELECT customer_email FROM tickets WHERE id = ?')
      .get(res.body.data.id) as { customer_email: string };
    expect(row.customer_email).toBe('user.name+tag@example.com');
  });

  it('V9: rejects invalid status enum', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: 'Valid description',
        customerEmail: 'user@example.com',
        status: 'Closed',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'status' })])
    );
  });

  it('V10: rejects invalid priority enum', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: 'Valid description',
        customerEmail: 'user@example.com',
        priority: 'Urgent',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'priority' })])
    );
  });

  it('V11: defaults status to Open when omitted', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Valid title',
        description: 'Valid description',
        customerEmail: 'user@example.com',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Open');
  });
});
