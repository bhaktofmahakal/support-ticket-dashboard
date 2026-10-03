import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../app.js';
import { runMigrations } from '../db/migrate.js';
import { seedDatabase } from '../db/seed.js';
import { config } from '../config.js';

async function runApiVerification() {
  console.log('=== PHASE 2: API ENDPOINT VERIFICATION ===\n');

  // Fresh in-memory DB with migrations and seed
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  runMigrations(db, config.migrationsDir);
  seedDatabase(db);

  const app = createApp({ db });

  // 1. Create OK
  console.log('--- 1. POST /api/tickets (Valid Ticket) ---');
  const res1 = await request(app)
    .post('/api/tickets')
    .send({
      title: 'Payment gateway timeout during checkout',
      description: 'Customers report seeing a spinner for 2 minutes before getting gateway timeout.',
      customerEmail: 'Checkout.Team@Acme.Corp',
      priority: 'High',
    });
  console.log(`Status: ${res1.status}`);
  console.log('Body:', JSON.stringify(res1.body, null, 2));
  if (res1.status !== 201 || !res1.body.data?.id || res1.body.data.customerEmail !== 'checkout.team@acme.corp') {
    throw new Error('Test 1 failed: create ok');
  }

  // 2. Create Invalid
  console.log('\n--- 2. POST /api/tickets (Validation Error - empty title & bad email) ---');
  const res2 = await request(app)
    .post('/api/tickets')
    .send({
      title: '   ',
      description: 'Some description',
      customerEmail: 'not-an-email',
      priority: 'Low',
    });
  console.log(`Status: ${res2.status}`);
  console.log('Body:', JSON.stringify(res2.body, null, 2));
  if (res2.status !== 400 || res2.body.error?.code !== 'VALIDATION_ERROR') {
    throw new Error('Test 2 failed: create invalid');
  }

  // 3. List combined
  console.log('\n--- 3. GET /api/tickets (search + status + priority + sort + page combined) ---');
  const res3 = await request(app)
    .get('/api/tickets?search=globex&status=In%20Progress&priority=High&sort=newest&page=1');
  console.log(`Status: ${res3.status}`);
  console.log('Body:', JSON.stringify(res3.body, null, 2));
  if (res3.status !== 200 || !Array.isArray(res3.body.data) || !res3.body.pagination) {
    throw new Error('Test 3 failed: list combined');
  }

  // 4. Stats while filter is active
  console.log('\n--- 4. GET /api/tickets/stats (Verifying stats ignore query params) ---');
  const res4 = await request(app)
    .get('/api/tickets/stats?status=Open&search=something');
  console.log(`Status: ${res4.status}`);
  console.log('Body:', JSON.stringify(res4.body, null, 2));
  // Total was 36 seeded + 1 created = 37
  if (res4.status !== 200 || res4.body.data.total !== 37) {
    throw new Error('Test 4 failed: stats independent of filters');
  }

  // 5. Get 200
  console.log('\n--- 5. GET /api/tickets/:id (Existing Ticket 1) ---');
  const res5 = await request(app).get('/api/tickets/1');
  console.log(`Status: ${res5.status}`);
  console.log('Body:', JSON.stringify(res5.body, null, 2));
  if (res5.status !== 200 || res5.body.data?.id !== 1) {
    throw new Error('Test 5 failed: get 200');
  }

  // 6. Get 404
  console.log('\n--- 6. GET /api/tickets/:id (Non-existent Ticket 99999) ---');
  const res6 = await request(app).get('/api/tickets/99999');
  console.log(`Status: ${res6.status}`);
  console.log('Body:', JSON.stringify(res6.body, null, 2));
  if (res6.status !== 404 || res6.body.error?.code !== 'NOT_FOUND') {
    throw new Error('Test 6 failed: get 404');
  }

  // 7. Get malformed ID
  console.log('\n--- 7. GET /api/tickets/:id (Malformed ID "abc") ---');
  const res7 = await request(app).get('/api/tickets/abc');
  console.log(`Status: ${res7.status}`);
  console.log('Body:', JSON.stringify(res7.body, null, 2));
  if (res7.status !== 400 || res7.body.error?.code !== 'VALIDATION_ERROR') {
    throw new Error('Test 7 failed: get malformed id');
  }

  // 8. Patch OK
  console.log('\n--- 8. PATCH /api/tickets/1 (Update status & priority) ---');
  const res8 = await request(app)
    .patch('/api/tickets/1')
    .send({
      status: 'Resolved',
      priority: 'Low',
    });
  console.log(`Status: ${res8.status}`);
  console.log('Body:', JSON.stringify(res8.body, null, 2));
  if (res8.status !== 200 || res8.body.data?.status !== 'Resolved' || res8.body.data?.priority !== 'Low') {
    throw new Error('Test 8 failed: patch ok');
  }

  // 9. Patch unknown field
  console.log('\n--- 9. PATCH /api/tickets/1 (Unknown field "title") ---');
  const res9 = await request(app)
    .patch('/api/tickets/1')
    .send({
      title: 'Hacked Title',
    });
  console.log(`Status: ${res9.status}`);
  console.log('Body:', JSON.stringify(res9.body, null, 2));
  if (res9.status !== 400 || res9.body.error?.code !== 'VALIDATION_ERROR') {
    throw new Error('Test 9 failed: patch unknown field');
  }

  // 10. Patch empty body
  console.log('\n--- 10. PATCH /api/tickets/1 (Empty Body {}) ---');
  const res10 = await request(app)
    .patch('/api/tickets/1')
    .send({});
  console.log(`Status: ${res10.status}`);
  console.log('Body:', JSON.stringify(res10.body, null, 2));
  if (res10.status !== 400 || res10.body.error?.code !== 'VALIDATION_ERROR') {
    throw new Error('Test 10 failed: patch empty body');
  }

  // 11. Malformed JSON
  console.log('\n--- 11. POST /api/tickets (Malformed JSON string) ---');
  const res11 = await request(app)
    .post('/api/tickets')
    .set('Content-Type', 'application/json')
    .send('{"title": "broken JSON');
  console.log(`Status: ${res11.status}`);
  console.log('Body:', JSON.stringify(res11.body, null, 2));
  if (res11.status !== 400 || res11.body.error?.code !== 'VALIDATION_ERROR') {
    throw new Error('Test 11 failed: malformed JSON');
  }

  // 12. Unknown route
  console.log('\n--- 12. GET /api/unknown-route (Unknown Route 404) ---');
  const res12 = await request(app).get('/api/unknown-route');
  console.log(`Status: ${res12.status}`);
  console.log('Body:', JSON.stringify(res12.body, null, 2));
  if (res12.status !== 404 || res12.body.error?.code !== 'NOT_FOUND') {
    throw new Error('Test 12 failed: unknown route');
  }

  db.close();
  console.log('\n=== ALL 12 API GATE CHECKS PASSED ===');
}

runApiVerification().catch((err) => {
  console.error('[API Verification Failed]:', err);
  process.exit(1);
});
