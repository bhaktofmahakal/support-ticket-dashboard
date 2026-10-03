# Test Plan

Target: **56 tests total** (48 API tests, 8 frontend tests). All tests are strictly isolated — each backend test receives a fresh in-memory SQLite database with migrations applied.

---

## API Tests (`apps/api/src/__tests__/`)

### Test Infrastructure

- **In-memory DB**: Each test creates `new Database(':memory:')`, runs migration SQL from `apps/api/migrations/`, and injects the DB into the Express app factory (`createApp({ db, now })`).
- **Injectable Clock**: `now` function can be injected or manipulated with a fake clock to test timestamp immutability and progression deterministically.
- **Supertest**: HTTP-level assertions against the Express app (no actual `listen()`).
- **Isolation**: No shared state between tests. No seed data unless a test explicitly executes the seed script.

---

### 1. Creation & Field Stripping Tests (`tickets.create.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| C1 | POST 201 body has id, createdAt, updatedAt as ISO strings | Verifies 201 status, monotonic integer id, and valid ISO-8601 UTC timestamp strings |
| C2 | POST with extra fields ignores them | Extra fields (`id`, `createdAt`, `updatedAt`, `unknownField`) are stripped by Zod schema and never persisted |

---

### 2. Validation Tests (`tickets.validation.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| V1 | rejects empty title | 400 + VALIDATION_ERROR + field: "title" |
| V2 | rejects whitespace-only title | 400 (trimmed to empty) |
| V3 | accepts 120-char title | 201 created |
| V4 | rejects 121-char title | 400 + details mentioning max length |
| V5 | rejects empty description | 400 + field: "description" |
| V6 | rejects whitespace-only description | 400 + field: "description" |
| V7 | rejects invalid email | 400 + field: "customerEmail" |
| V8 | lowercases email on create | 201 + customerEmail is stored in lowercase |
| V9 | rejects invalid status enum | 400 + field: "status" |
| V10 | rejects invalid priority enum | 400 + field: "priority" |
| V11 | defaults status to Open when omitted | 201 + status: "Open" |

---

### 3. List / Query Tests (`tickets.list.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| L1 | returns paginated results with correct meta | pagination shape: page, pageSize, total, totalPages |
| L2 | search filters by title (case-insensitive) | LIKE match on title |
| L3 | search filters by customer email | LIKE match on customer email |
| L4 | search + status filter combined | AND logic between search and status |
| L5 | sort=newest returns descending order | created_at DESC, id DESC |
| L6 | sort=oldest returns ascending order | created_at ASC, id ASC |
| L7 | wildcard characters in search are escaped | Searching for literal "%" or "_" escapes wildcards |
| L8 | stable sort across pages | No duplicates or skipped items when paginating with duplicate timestamps |
| L9 | out-of-range page returns empty data with correct totals | page=99 when total=36 → data:[], total=36, totalPages=4 |
| L10 | page=0 returns 400 | VALIDATION_ERROR |
| L11 | page=abc returns 400 | VALIDATION_ERROR |
| L12 | status-only filter | Filters correctly by status alone |
| L13 | priority-only filter | Filters correctly by priority alone |
| L14 | search+status+priority+sort+page combined | All query parameters combined in single query |
| L15 | empty-string params treated as absent | `?search=&status=&priority=` treated as default query |
| L16 | whitespace-only search treated as absent | `?search=%20%20` treated as absent search |

---

### 4. Update Tests (`tickets.update.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| U1 | updates status successfully | 200, new status persisted in database |
| U2 | updates priority successfully | 200, new priority persisted in database |
| U3 | updated_at changes on PATCH | Uses fake clock advancing time; asserts updatedAt is strictly greater than before |
| U4 | created_at does NOT change on PATCH | Asserts createdAt remains strictly identical before and after PATCH |
| U5 | rejects unknown fields | 400 + VALIDATION_ERROR when passing extra fields (e.g. `title`) |
| U6 | rejects empty body | 400 + VALIDATION_ERROR when sending `{}` or no body |
| U7 | returns 404 for non-existent ticket | 404 + NOT_FOUND for missing id |
| U8 | invalid enum on PATCH -> 400 | 400 when passing invalid status or priority |
| U9 | invalid id on PATCH -> 400 | 400 for non-numeric or non-positive id |

---

### 5. Stats Tests (`tickets.stats.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| S0 | stats on an empty DB returns zeros | Returns `{ data: { total: 0, open: 0, inProgress: 0, resolved: 0 } }` |
| S1 | returns correct counts by status | total, open, inProgress, resolved accurately match dataset |
| S2 | stats are independent of query params | Adding `?status=Open&search=foo` does not alter stats result |
| S3 | stats update after create and after PATCH | Counts increment and transfer accurately on mutations |

---

### 6. Error Handling Tests (`tickets.errors.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| E1 | malformed JSON returns 400 with consistent shape | VALIDATION_ERROR, no stack trace |
| E2 | unknown route returns 404 with consistent shape | NOT_FOUND `{ error: { code: 'NOT_FOUND', message: 'Route not found' } }` |
| E3 | invalid id format returns 400 | VALIDATION_ERROR for GET /api/tickets/abc |

---

### 7. Database, Seed & Migration Tests (`db.test.ts`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| D1 | seed inserts exactly 36 rows | Covers all 3 statuses, all 3 priorities, and a 120-char title |
| D2 | running seed twice keeps 36 rows | Proves seed script idempotency (skips insert when table is non-empty) |
| D3 | migrations are idempotent | Running migration runner multiple times does not error or duplicate tables |

---

## Frontend Tests (`apps/web/src/__tests__/`)

### Test Infrastructure

- **Vitest** + **jsdom** + **@testing-library/react**
- Manual fetch / MSW mocking for standard API responses and error shapes
- **Wrapper**: `QueryClientProvider` + `BrowserRouter` (or `MemoryRouter`)

### Component & Page Tests (`frontend.test.tsx`)

| # | Test Name | What It Verifies |
|---|-----------|-----------------|
| F1 | form shows validation errors for invalid input | Inline field-level error messages render for empty title, bad email |
| F2 | form disables submit while pending | Button disabled state and loading indicator during submission |
| F3 | list renders loading skeleton | Loading state displays skeleton placeholders while query is pending |
| F4 | list renders empty state when no tickets | "No tickets yet" message + "Create Ticket" CTA displayed |
| F5 | stats cards render correct counts | Values match mock API payload |
| F6 | changing a filter writes URL params and resets page to 1 | Interacting with search/filter controls updates query string and resets page |
| F7 | no-match state shows Clear filters | When filter returns 0 tickets, displays "No tickets found" and "Clear filters" button |
| F8 | error state shows Retry | When API returns 500/error, displays error banner with clickable "Retry" button |

---

## Test Totals

| Suite | Count |
|-------|:-----:|
| Creation & Stripping (C) | 2 |
| Validation (V) | 11 |
| List/Query (L) | 16 |
| Update (U) | 9 |
| Stats (S) | 4 |
| Errors (E) | 3 |
| Database / Seed / Migration (D) | 3 |
| **API Total** | **48** |
| Frontend Components & UX (F) | 8 |
| **Grand Total** | **56** |

---

## Test Commands

```bash
npm test          # All tests across workspaces (API + web)
npm run test:api  # API test suite (48 tests)
npm run test:web  # Frontend test suite (8 tests)
```
