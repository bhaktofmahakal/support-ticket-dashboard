import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('POST /api/tickets - Creation & Field Stripping', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext('2026-09-15T12:00:00.000Z');
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('C1: POST 201 body has id, createdAt, updatedAt as ISO strings', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Billing webhook failure on subscription renewal',
        description: 'Webhook fails with HTTP 500 when customer has overdue invoice.',
        customerEmail: 'finance@customer.com',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    const { data } = res.body;

    expect(typeof data.id).toBe('number');
    expect(data.id).toBeGreaterThan(0);
    expect(data.title).toBe('Billing webhook failure on subscription renewal');
    expect(data.description).toBe('Webhook fails with HTTP 500 when customer has overdue invoice.');
    expect(data.customerEmail).toBe('finance@customer.com');
    expect(data.status).toBe('Open');
    expect(data.priority).toBe('High');

    // ISO-8601 validation
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(data.createdAt).toMatch(isoRegex);
    expect(data.updatedAt).toMatch(isoRegex);
    expect(data.createdAt).toBe('2026-09-15T12:00:00.000Z');
    expect(data.updatedAt).toBe('2026-09-15T12:00:00.000Z');
  });

  it('C2: POST with extra fields ignores them', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .send({
        title: 'Security flaw: unauthorized access to admin panel',
        description: 'Session cookie not properly signed.',
        customerEmail: 'security@acme.com',
        priority: 'High',
        // Client attempts to set system fields and unknown attributes
        id: 9999,
        createdAt: '1999-01-01T00:00:00.000Z',
        updatedAt: '1999-01-01T00:00:00.000Z',
        unknownField: 'malicious-payload',
        adminBypass: true,
      });

    expect(res.status).toBe(201);
    const { data } = res.body;

    // Must be assigned by system, not client
    expect(data.id).toBe(1);
    expect(data.createdAt).toBe('2026-09-15T12:00:00.000Z');
    expect(data.updatedAt).toBe('2026-09-15T12:00:00.000Z');
    expect(data.unknownField).toBeUndefined();
    expect(data.adminBypass).toBeUndefined();

    // Verify DB does not contain extra fields
    const row = ctx.db.prepare('SELECT * FROM tickets WHERE id = ?').get(data.id) as Record<string, unknown>;
    expect(row.id).toBe(1);
    expect(row.created_at).toBe('2026-09-15T12:00:00.000Z');
    expect(row.unknownField).toBeUndefined();
  });
});
