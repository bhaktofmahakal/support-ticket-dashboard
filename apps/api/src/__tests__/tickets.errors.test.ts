import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './test-helper.js';

describe('API Error Handling Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx.db.close();
  });

  it('E1: malformed JSON returns 400 with consistent shape', async () => {
    const res = await request(ctx.app)
      .post('/api/tickets')
      .set('Content-Type', 'application/json')
      .send('{ "title": "broken JSON, missing closing brace');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON in request body',
      },
    });

    // Asserts no stack trace leaked over wire
    expect(res.body.stack).toBeUndefined();
    expect(res.body.error.stack).toBeUndefined();
  });

  it('E2: unknown route returns 404 with consistent shape', async () => {
    const res = await request(ctx.app).get('/api/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
    expect(res.body.stack).toBeUndefined();
  });

  it('E3: invalid id format returns 400', async () => {
    const res = await request(ctx.app).get('/api/tickets/abc');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'id' })])
    );
  });
});
