#!/usr/bin/env node

/**
 * End-to-End Smoke Verification Script
 * Validates local production and live cloud deployments.
 * Zero external dependencies — runs on Node.js 20+ built-in fetch.
 *
 * Usage:
 *   node scripts/smoke.mjs <baseUrl> [--write]
 *
 * Example:
 *   node scripts/smoke.mjs http://localhost:3001 --write
 *   node scripts/smoke.mjs https://support-ticket-dashboard.onrender.com
 */

const rawArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const baseUrl = (rawArg || 'http://localhost:3001').replace(/\/$/, '');
const isWrite = process.argv.includes('--write');

console.log(`\n======================================================`);
console.log(`  Support Ticket Dashboard — Smoke Verification`);
console.log(`  Target URL : ${baseUrl}`);
console.log(`  Write Mode : ${isWrite ? 'ENABLED (--write)' : 'READ-ONLY (live safe)'}`);
console.log(`======================================================\n`);

const results = [];

function recordResult(id, description, status, details = '') {
  results.push({ id, description, status, details });
  const icon = status === 'PASS' ? '✓ PASS' : status === 'SKIP' ? '- SKIP' : '✗ FAIL';
  console.log(`[${icon}] #${id}: ${description} ${details ? `(${details})` : ''}`);
}

async function run() {
  let statsInitial = null;

  // 1. GET /api/health -> 200
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      recordResult(1, 'GET /api/health returns 200 and status ok', 'PASS');
    } else {
      recordResult(1, 'GET /api/health returns 200 and status ok', 'FAIL', `status=${res.status}`);
    }
  } catch (err) {
    recordResult(1, 'GET /api/health returns 200 and status ok', 'FAIL', err.message);
  }

  // 2. GET /api/tickets -> 200, pagination.pageSize 10, total >= 25, data length 10
  try {
    const res = await fetch(`${baseUrl}/api/tickets`);
    const json = await res.json();
    const ok =
      res.status === 200 &&
      json.pagination?.pageSize === 10 &&
      json.pagination?.total >= 25 &&
      Array.isArray(json.data) &&
      json.data.length === 10;
    if (ok) {
      recordResult(2, 'GET /api/tickets returns pageSize 10, total >= 25, data length 10', 'PASS', `total=${json.pagination.total}`);
    } else {
      recordResult(2, 'GET /api/tickets returns pageSize 10, total >= 25, data length 10', 'FAIL', JSON.stringify(json.pagination));
    }
  } catch (err) {
    recordResult(2, 'GET /api/tickets returns pageSize 10, total >= 25, data length 10', 'FAIL', err.message);
  }

  // 3. Walk every page: no duplicate ids, union of ids equals total
  try {
    const firstRes = await fetch(`${baseUrl}/api/tickets?page=1`);
    const firstJson = await firstRes.json();
    const totalPages = firstJson.pagination.totalPages;
    const expectedTotal = firstJson.pagination.total;

    const allIds = [];
    for (let p = 1; p <= totalPages; p++) {
      const pageRes = await fetch(`${baseUrl}/api/tickets?page=${p}`);
      const pageJson = await pageRes.json();
      for (const item of pageJson.data) {
        allIds.push(item.id);
      }
    }

    const uniqueIds = new Set(allIds);
    const noDuplicates = uniqueIds.size === allIds.length;
    const unionEqualsTotal = allIds.length === expectedTotal;

    if (noDuplicates && unionEqualsTotal) {
      recordResult(3, 'Walk every page: no duplicate ids, union equals total', 'PASS', `${allIds.length} tickets across ${totalPages} pages`);
    } else {
      recordResult(3, 'Walk every page: no duplicate ids, union equals total', 'FAIL', `unique=${uniqueIds.size}, total=${allIds.length}, expected=${expectedTotal}`);
    }
  } catch (err) {
    recordResult(3, 'Walk every page: no duplicate ids, union equals total', 'FAIL', err.message);
  }

  // 4. GET /api/tickets/stats -> open + inProgress + resolved == total
  try {
    const res = await fetch(`${baseUrl}/api/tickets/stats`);
    const json = await res.json();
    statsInitial = json.data;
    const sum = statsInitial.open + statsInitial.inProgress + statsInitial.resolved;
    if (res.status === 200 && sum === statsInitial.total) {
      recordResult(4, 'GET /api/tickets/stats: open + inProgress + resolved == total', 'PASS', `total=${statsInitial.total}`);
    } else {
      recordResult(4, 'GET /api/tickets/stats: open + inProgress + resolved == total', 'FAIL', `sum=${sum} vs total=${statsInitial?.total}`);
    }
  } catch (err) {
    recordResult(4, 'GET /api/tickets/stats: open + inProgress + resolved == total', 'FAIL', err.message);
  }

  // 5. Stats with ?status=Open&search=zzz returns identical numbers (independent of filters)
  try {
    const res = await fetch(`${baseUrl}/api/tickets/stats?status=Open&search=zzz`);
    const json = await res.json();
    const statsFiltered = json.data;
    const match =
      statsFiltered &&
      statsInitial &&
      statsFiltered.total === statsInitial.total &&
      statsFiltered.open === statsInitial.open &&
      statsFiltered.inProgress === statsInitial.inProgress &&
      statsFiltered.resolved === statsInitial.resolved;
    if (match) {
      recordResult(5, 'Stats query parameters do not alter dataset-wide counts', 'PASS');
    } else {
      recordResult(5, 'Stats query parameters do not alter dataset-wide counts', 'FAIL', 'filtered stats differ from baseline');
    }
  } catch (err) {
    recordResult(5, 'Stats query parameters do not alter dataset-wide counts', 'FAIL', err.message);
  }

  // 6. Combined query: search + status + priority + sort=oldest + page=1
  try {
    const res = await fetch(`${baseUrl}/api/tickets?status=Open&priority=High&sort=oldest&page=1`);
    const json = await res.json();
    const rows = json.data || [];
    let matchesAll = rows.length > 0;
    let isAscending = true;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status !== 'Open' || rows[i].priority !== 'High') {
        matchesAll = false;
      }
      if (i > 0) {
        const prev = new Date(rows[i - 1].createdAt).getTime();
        const curr = new Date(rows[i].createdAt).getTime();
        if (curr < prev) isAscending = false;
      }
    }

    if (matchesAll && isAscending) {
      recordResult(6, 'Combined query matches filters and sorts oldest-first', 'PASS', `${rows.length} rows verified`);
    } else {
      recordResult(6, 'Combined query matches filters and sorts oldest-first', 'FAIL', `matches=${matchesAll}, asc=${isAscending}`);
    }
  } catch (err) {
    recordResult(6, 'Combined query matches filters and sorts oldest-first', 'FAIL', err.message);
  }

  // 7. GET /api/tickets/999999 -> 404 error shape; GET /api/tickets/abc -> 400 error shape
  try {
    const res404 = await fetch(`${baseUrl}/api/tickets/999999`);
    const json404 = await res404.json();
    const res400 = await fetch(`${baseUrl}/api/tickets/abc`);
    const json400 = await res400.json();

    const ok404 = res404.status === 404 && json404.error?.code === 'NOT_FOUND';
    const ok400 = res400.status === 400 && json400.error?.code === 'VALIDATION_ERROR';

    if (ok404 && ok400) {
      recordResult(7, '404 for missing ID and 400 for malformed ID return error shapes', 'PASS');
    } else {
      recordResult(7, '404 for missing ID and 400 for malformed ID return error shapes', 'FAIL', `404=${ok404}, 400=${ok400}`);
    }
  } catch (err) {
    recordResult(7, '404 for missing ID and 400 for malformed ID return error shapes', 'FAIL', err.message);
  }

  // 8. POST invalid body -> 400 with details[]; malformed JSON -> 400 error shape
  try {
    const invalidBodyRes = await fetch(`${baseUrl}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    const invalidBodyJson = await invalidBodyRes.json();
    const okInvalid =
      invalidBodyRes.status === 400 &&
      invalidBodyJson.error?.code === 'VALIDATION_ERROR' &&
      Array.isArray(invalidBodyJson.error?.details) &&
      invalidBodyJson.error.details.length > 0;

    const malformedRes = await fetch(`${baseUrl}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not valid json }',
    });
    const malformedJson = await malformedRes.json();
    const okMalformed =
      malformedRes.status === 400 && malformedJson.error?.code === 'VALIDATION_ERROR';

    if (okInvalid && okMalformed) {
      recordResult(8, 'POST validation errors and malformed JSON return 400 with details', 'PASS');
    } else {
      recordResult(8, 'POST validation errors and malformed JSON return 400 with details', 'FAIL', `invalid=${okInvalid}, malformed=${okMalformed}`);
    }
  } catch (err) {
    recordResult(8, 'POST validation errors and malformed JSON return 400 with details', 'FAIL', err.message);
  }

  // 9. PATCH {} -> 400; PATCH {"title":"x"} -> 400
  try {
    const emptyPatchRes = await fetch(`${baseUrl}/api/tickets/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const emptyPatchJson = await emptyPatchRes.json();
    const okEmpty = emptyPatchRes.status === 400 && emptyPatchJson.error?.code === 'VALIDATION_ERROR';

    const unknownFieldRes = await fetch(`${baseUrl}/api/tickets/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New title not allowed' }),
    });
    const unknownFieldJson = await unknownFieldRes.json();
    const okUnknown = unknownFieldRes.status === 400 && unknownFieldJson.error?.code === 'VALIDATION_ERROR';

    if (okEmpty && okUnknown) {
      recordResult(9, 'PATCH rejects empty body and unknown fields with 400', 'PASS');
    } else {
      recordResult(9, 'PATCH rejects empty body and unknown fields with 400', 'FAIL', `empty=${okEmpty}, unknown=${okUnknown}`);
    }
  } catch (err) {
    recordResult(9, 'PATCH rejects empty body and unknown fields with 400', 'FAIL', err.message);
  }

  // 10. GET /api/nope -> 404 JSON error shape (must not be HTML)
  try {
    const res = await fetch(`${baseUrl}/api/nope`);
    const cType = res.headers.get('content-type') || '';
    const json = await res.json();
    const ok = res.status === 404 && cType.includes('application/json') && json.error?.code === 'NOT_FOUND';
    if (ok) {
      recordResult(10, 'Unmatched /api route returns JSON 404 (not HTML)', 'PASS');
    } else {
      recordResult(10, 'Unmatched /api route returns JSON 404 (not HTML)', 'FAIL', `status=${res.status}, cType=${cType}`);
    }
  } catch (err) {
    recordResult(10, 'Unmatched /api route returns JSON 404 (not HTML)', 'FAIL', err.message);
  }

  // 11. GET /tickets/3 (non-API deep link) -> 200 text/html containing app root
  try {
    const res = await fetch(`${baseUrl}/tickets/3`);
    const cType = res.headers.get('content-type') || '';
    const text = await res.text();
    const ok = res.status === 200 && cType.includes('text/html') && text.includes('id="root"');
    if (ok) {
      recordResult(11, 'SPA fallback serves index.html for deep links (/tickets/3)', 'PASS');
    } else {
      recordResult(11, 'SPA fallback serves index.html for deep links (/tickets/3)', 'FAIL', `status=${res.status}, cType=${cType}`);
    }
  } catch (err) {
    recordResult(11, 'SPA fallback serves index.html for deep links (/tickets/3)', 'FAIL', err.message);
  }

  // 12. Responses never contain 'stack' or file paths
  try {
    const testEndpoints = [
      `${baseUrl}/api/tickets/999999`,
      `${baseUrl}/api/tickets/abc`,
      `${baseUrl}/api/nope`,
    ];
    let safe = true;
    for (const ep of testEndpoints) {
      const res = await fetch(ep);
      const text = await res.text();
      if (text.includes('"stack"') || text.includes('node_modules') || text.includes('at Function.') || text.includes('.ts:')) {
        safe = false;
      }
    }
    if (safe) {
      recordResult(12, 'Server error responses never leak stack traces or file paths', 'PASS');
    } else {
      recordResult(12, 'Server error responses never leak stack traces or file paths', 'FAIL', 'Found trace leak');
    }
  } catch (err) {
    recordResult(12, 'Server error responses never leak stack traces or file paths', 'FAIL', err.message);
  }

  // 13. Live-safe write test: PATCH ticket 1 status, verify, then restore
  try {
    const getRes1 = await fetch(`${baseUrl}/api/tickets/1`);
    const getJson1 = await getRes1.json();
    const initialStatus = getJson1.data.status;
    const targetStatus = initialStatus === 'Open' ? 'In Progress' : 'Open';

    // Step a: PATCH to target
    const patchRes1 = await fetch(`${baseUrl}/api/tickets/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    });
    await patchRes1.json();

    // Step b: GET to verify persisted
    const verifyRes1 = await fetch(`${baseUrl}/api/tickets/1`);
    const verifyJson1 = await verifyRes1.json();
    const persisted = verifyJson1.data.status === targetStatus;

    // Step c: Restore back to initial
    const restoreRes = await fetch(`${baseUrl}/api/tickets/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: initialStatus }),
    });

    const verifyRes2 = await fetch(`${baseUrl}/api/tickets/1`);
    const verifyJson2 = await verifyRes2.json();
    const restored = verifyJson2.data.status === initialStatus;

    if (patchRes1.status === 200 && restoreRes.status === 200 && persisted && restored) {
      recordResult(13, 'Live-safe triage update and restore roundtrip (Ticket #1)', 'PASS', `${initialStatus} -> ${targetStatus} -> ${initialStatus}`);
    } else {
      recordResult(13, 'Live-safe triage update and restore roundtrip (Ticket #1)', 'FAIL', `persisted=${persisted}, restored=${restored}`);
    }
  } catch (err) {
    recordResult(13, 'Live-safe triage update and restore roundtrip (Ticket #1)', 'FAIL', err.message);
  }

  // 14. Only with --write: POST a valid ticket -> 201, find it via search, stats total increased by 1
  if (isWrite) {
    try {
      const statsBeforeRes = await fetch(`${baseUrl}/api/tickets/stats`);
      const statsBeforeJson = await statsBeforeRes.json();
      const beforeTotal = statsBeforeJson.data.total;

      const smokeTag = `SMOKE_${Date.now()}`;
      const postRes = await fetch(`${baseUrl}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Automated Smoke Test Ticket ${smokeTag}`,
          description: 'This is an end-to-end smoke verification created during rehearsal.',
          customerEmail: `smoke.${smokeTag.toLowerCase()}@example.org`,
          priority: 'High',
        }),
      });
      const postJson = await postRes.json();
      const createdId = postJson.data?.id;

      // Find via search
      const searchRes = await fetch(`${baseUrl}/api/tickets?search=${smokeTag}`);
      const searchJson = await searchRes.json();
      const foundInSearch = searchJson.data?.some((t) => t.id === createdId);

      // Verify stats incremented by 1
      const statsAfterRes = await fetch(`${baseUrl}/api/tickets/stats`);
      const statsAfterJson = await statsAfterRes.json();
      const afterTotal = statsAfterJson.data.total;

      const ok = postRes.status === 201 && foundInSearch && afterTotal === beforeTotal + 1;
      if (ok) {
        recordResult(14, 'POST ticket, discover via search, and verify stats incremented', 'PASS', `id=#${createdId}, total=${afterTotal}`);
      } else {
        recordResult(14, 'POST ticket, discover via search, and verify stats incremented', 'FAIL', `status=${postRes.status}, found=${foundInSearch}, count=${afterTotal} vs ${beforeTotal + 1}`);
      }
    } catch (err) {
      recordResult(14, 'POST ticket, discover via search, and verify stats incremented', 'FAIL', err.message);
    }
  } else {
    recordResult(14, 'POST ticket, discover via search, and verify stats incremented', 'SKIP', 'Pass --write flag to execute');
  }

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`  Smoke Test Results Summary`);
  console.log(`======================================================`);
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const skipCount = results.filter((r) => r.status === 'SKIP').length;

  console.log(`Total Checks : ${results.length}`);
  console.log(`Passed       : ${passCount}`);
  console.log(`Failed       : ${failCount}`);
  console.log(`Skipped      : ${skipCount}\n`);

  if (failCount > 0) {
    console.error(`❌ Smoke tests FAILED with ${failCount} failure(s).`);
    process.exit(1);
  } else {
    console.log(`✅ All checks PASSED successfully!`);
    process.exit(0);
  }
}

run();
