# Docs Audit & Review Report

> **Auditor Role**: Strict Reviewer  
> **Target**: `docs/00-assignment.md`, `docs/01` through `docs/09`, `docs/11`, `AGENTS.md`, and `CLAUDE.md`.  
> **Date**: 2026-10-03  

---

## 1. Requirement Coverage Analysis

Auditing every line of `docs/00-assignment.md` against the planning documents and traceability matrix (`docs/01-requirements-traceability.md`):

| # | Assignment Line / Requirement | Status | Document Reference | Notes / Findings |
|---|-------------------------------|:------:|--------------------|------------------|
| 1 | Problem statement: spreadsheet replacement, create tickets, track status, find requests needing attention | **PASS** | `docs/01` §1, `docs/02` §Goal | Core problem statement defined and reflected in user stories US-1 to US-9. |
| 2 | Frontend, backend API, and persistent data storage | **PASS** | `docs/01` R-18, `docs/03` §Monorepo | Vite+React (web), Express (API), SQLite via better-sqlite3 with migrations. |
| 3 | Title: required, maximum 120 characters | **PASS** | `docs/01` R-01, `docs/04`, `docs/05` | Zod schema + DB CHECK constraint. Whitespace-only rejected. |
| 4 | Description: required | **PASS** | `docs/01` R-02, `docs/04`, `docs/05` | Zod schema + DB CHECK constraint. Trimmed non-empty. |
| 5 | Customer email: required, valid email format | **PASS** | `docs/01` R-03, `docs/04`, `docs/05` | Zod email validation, lowercased on ingest, DB format CHECK. |
| 6 | Priority: Low, Medium, or High | **PASS** | `docs/01` R-04, `docs/04`, `docs/05` | Zod enum + DB CHECK `IN ('Low', 'Medium', 'High')`. |
| 7 | Status: Open, In Progress, or Resolved; defaults to Open | **PASS** | `docs/01` R-05, `docs/04`, `docs/05` | Zod enum + DB default `'Open'`, DB CHECK `IN ('Open', 'In Progress', 'Resolved')`. |
| 8 | Created and updated timestamps: generated automatically | **PASS** | `docs/01` R-06, `docs/04`, `docs/05` | ISO-8601 UTC in DB defaults. `created_at` immutable; `updated_at` refreshed on PATCH. |
| 9 | Validate inputs on both frontend and backend; display useful error messages | **PASS** | `docs/01` R-07, `docs/04`, `docs/07` | Shared Zod schemas in `packages/shared`, inline field errors + server error mapping. |
| 10 | Search by title or customer email | **PASS** | `docs/01` R-08, `docs/04`, `docs/05` | Case-insensitive LIKE with wildcard escaping on `title` OR `customer_email`. |
| 11 | Filter by status and priority | **PASS** | `docs/01` R-09, `docs/04`, `docs/05` | Parameterized WHERE filters in repository layer. |
| 12 | Sort by creation date, newest or oldest first | **PASS** | `docs/01` R-10, `docs/04`, `docs/05` | ORDER BY `created_at` with deterministic `id` tie-breaker. |
| 13 | Pagination with 10 tickets per page | **PASS** | `docs/01` R-11, `docs/04` | LIMIT 10 OFFSET (page-1)*10. Returns `{ data, pagination: { page, pageSize: 10, total, totalPages } }`. |
| 14 | Search and filters should work together | **PASS** | `docs/01` R-12, `docs/04`, `docs/07` | Repository WHERE clauses combine search, status, and priority via AND. |
| 15 | Filtering, sorting, and pagination handled by backend | **PASS** | `docs/01` R-13, `docs/03`, `docs/04` | Fully executed in SQL repository; no client-side filtering. |
| 16 | Open ticket, view complete details, update status and priority | **PASS** | `docs/01` R-14, R-15, `docs/04` | `GET /api/tickets/:id` + `PATCH /api/tickets/:id`. Changes persist after refresh. |
| 17 | Show summary counts: Total, Open, In Progress, Resolved | **PASS** | `docs/01` R-16, `docs/04` | `GET /api/tickets/stats` returns all 4 counts. |
| 18 | Counts reflect entire dataset, regardless of active filters | **PASS** | `docs/01` R-17, `docs/04`, `docs/07` | `GET /api/tickets/stats` explicitly ignores query parameters. |
| 19 | Frontend framework, backend framework, and database of choice | **PASS** | `docs/01` R-18, `docs/03` | React 19 + Express 5 + SQLite (better-sqlite3). |
| 20 | Responsive interface suitable for desktop and mobile | **PASS** | `docs/01` R-19, `docs/02`, `docs/03` | Table on desktop (≥768px), stacked cards on mobile (375px), verified without horizontal scroll. |
| 21 | Loading, empty, and error states | **PASS** | `docs/01` R-20, `docs/02`, `docs/07` | Skeletons for loading; distinct empty states ("No tickets" vs "No matches"); error state with retry. |
| 22 | Meaningful HTTP status codes and consistent API error responses | **PASS** | `docs/01` R-21, `docs/04` | 200, 201, 400, 404, 500 with standard `{ error: { code, message, details? } }`. |
| 23 | Organized for another developer to understand and extend | **PASS** | `docs/01` R-22, `docs/03`, `docs/09` | Layered monorepo architecture + comprehensive `docs/09-EXTENDING.md`. |
| 24 | At least 3 automated tests (validation, querying, updates) | **PASS** | `docs/01` R-23, `docs/07` | 39 automated tests planned (validation, query, updates, stats, errors, frontend). |
| 25 | Seed data containing ≥25 tickets with varied statuses and priorities | **PASS** | `docs/01` R-24, `docs/05` | 36 realistic tickets with balanced statuses, priorities, and edge cases. |
| 26 | Submission: Git repo, source code, DB migrations/seed instructions, README | **PASS** | `docs/01` R-25..R-28, `docs/08` | Full submission checklist and README skeleton provided. |
| 27 | Screenshots or demo video | **PASS** | `docs/01` R-29, `docs/08` | Documented screenshot capture list in `docs/08`. |
| 28 | Runs locally using documented instructions | **PASS** | `docs/01` R-30, `docs/08` | `npm run setup && npm run dev` documented. |
| 29 | Max 6 hours time limit & honest tradeoffs | **PASS** | `docs/01` R-31, `docs/06`, `docs/08` | Build plan capped at 5h 25m core + 35m buffer = 6h. |
| 30 | AI tools description & interview preparation | **PASS** | `docs/01` R-32, R-33, `docs/08`, `docs/09` | AI usage section in README skeleton and live change guide in `docs/09`. |

**Coverage Conclusion**: **100% PASS** on all requirements from `docs/00-assignment.md`. No requirements missing.

---

## 2. Contradictions Between Documents

During the audit, the following 4 contradictions were identified across docs and configuration:

### Contradiction 1: Phase Numbering & Structure Mismatch
- **Issue**: `docs/06-PHASES.md` defined 7 phases labeled Phase 0 through Phase 6 (where Phase 1 bundled database, repository, service, and all HTTP endpoints together, and Phase 3 bundled all frontend together). In contrast, the prompt pack (`ticket-dashboard-prompt-pack.md` P3-1 through P3-7 and AUTOPILOT) defines 7 sequential phases:
  - Phase 1: Scaffold + database + seed (data layer only, no HTTP routes)
  - Phase 2: API routes + middleware + services
  - Phase 3: Backend tests (Vitest + Supertest)
  - Phase 4: Frontend foundation, dashboard and list
  - Phase 5: Create, detail, update
  - Phase 6: Polish, responsive, accessibility, frontend tests, screenshots
  - Phase 7: Production build, README, deploy config
- **Fix**: Update `docs/06-PHASES.md` to align exactly with Phase 1 through Phase 7.

### Contradiction 2: Backend Port Inconsistency
- **Issue**: `AGENTS.md` and `CLAUDE.md` previously listed API on port 3000 (`npm run dev`). `docs/06-PHASES.md`, `docs/08-SUBMISSION-CHECKLIST.md`, and `docs/03-ARCHITECTURE.md` listed port `:3001` (`http://localhost:3001`). `docs/11-DEPLOYMENT.md` had port 3000.
- **Fix**: Standardize on `PORT=3001` for API in development (leaving `5173` for Vite web frontend) across `AGENTS.md`, `CLAUDE.md`, and `docs/11-DEPLOYMENT.md`.

### Contradiction 3: Stats API Response Shape Consistency
- **Issue**: In `docs/04-API-SPEC.md`, `GET /api/tickets/stats` returned `{ "data": { "total": 36, "open": 15, "inProgress": 12, "resolved": 9 } }`. However, in `docs/03-ARCHITECTURE.md` line 132 and `docs/09-EXTENDING.md` line 100, the response was shown without the `"data"` envelope: `{ "total": 36, ... }`.
- **Fix**: Update `docs/03-ARCHITECTURE.md` and `docs/09-EXTENDING.md` to wrap the stats payload inside `{ data: { total, open, inProgress, resolved } }` for consistency across all endpoints (`POST`, `GET /:id`, `GET /stats`).

### Contradiction 4: API Test Count Minimum Target
- **Issue**: `docs/06-PHASES.md` mentioned "≥14 tests" in Phase 2 exit criteria, while `docs/07-TEST-PLAN.md` has 34 API tests and `docs/01` / prompt pack target ≥18 total.
- **Fix**: Align the exit criteria in `docs/06-PHASES.md` to explicitly require ≥18 API tests (with all 34 planned test cases in `docs/07`).

---

## 3. Hidden-Trap Verification

| Trap / Edge Case | Documented Safeguard | Verification Result |
|------------------|----------------------|:-------------------:|
| **Stats independent of filters** | `GET /api/tickets/stats` ignores all query parameters; always runs `SELECT COUNT(*) ... GROUP BY status` across whole table. | **PASS** |
| **Search + filters combined** | Repository builder constructs `WHERE (title LIKE ? ESCAPE '\' OR customer_email LIKE ? ESCAPE '\') AND status = ? AND priority = ?`. | **PASS** |
| **Stable sort tie-breaker** | `ORDER BY created_at <DIR>, id <DIR>` prevents jitter and duplicates/missing items across page boundaries. | **PASS** |
| **Wildcard escaping in LIKE** | Custom `escapeLikeWildcards` escapes `%`, `_`, and `\` before passing to query with `ESCAPE '\'`. | **PASS** |
| **Whitespace-only title** | Rejected in Zod schema `z.string().trim().min(1)` and DB CHECK `length(trim(title)) > 0`. | **PASS** |
| **120 boundary check** | Title of 120 chars accepted; 121 chars rejected. Covered in test V3 and V4. | **PASS** |
| **`updated_at` semantics** | On PATCH, `updated_at` updates to current UTC ISO timestamp; `created_at` remains immutable. Covered in U3 and U4. | **PASS** |
| **Empty vs No-match states** | Explicit component logic: if total tickets = 0 → "No tickets yet" + Create CTA; if total > 0 but filtered = 0 → "No tickets found" + Clear Filters CTA. | **PASS** |
| **URL state synchronization** | `search`, `status`, `priority`, `sort`, `page` all live in URL query params. Survives browser refresh and shareable. | **PASS** |
| **Page reset on filter change** | Any change to search term, status filter, priority filter, or sort direction explicitly resets `page` to `1`. | **PASS** |
| **Seed edge cases** | 36 tickets include: 120-char title, identical timestamps, mixed-case email, shared email domains, varied priorities/statuses. | **PASS** |
| **PATCH strictness** | Only `status` and `priority` accepted. Empty body → 400. Unknown fields (e.g. `title`) → 400 with `Unknown fields: ...`. | **PASS** |
| **Malformed JSON handling** | Handled in custom Express error middleware catching `SyntaxError` from `express.json()` → returns 400 with standard error shape. | **PASS** |
| **SPA fallback not swallowing `/api` 404** | Router registers `/api/*` first with catch-all 404 JSON middleware. Static files and SPA wildcard fallback `*` registered AFTER `/api`. | **PASS** |

---

## 4. Feasibility & Scope Analysis (`docs/06-PHASES.md`)

The total time budget is **6 hours**. The restructured 7-phase build breaks down as follows:

| Phase | Description | Estimated Time | Cumulative Time |
|-------|-------------|:--------------:|:---------------:|
| **Phase 1** | Monorepo scaffolding, DB connection, migrations, 36 seed tickets, repository layer | 45 min | 0h 45m |
| **Phase 2** | Express app, service layer, validation middleware, all REST endpoints, error handler | 50 min | 1h 35m |
| **Phase 3** | Backend test suite (Vitest + Supertest, in-memory DB, ≥18 tests) | 40 min | 2h 15m |
| **Phase 4** | Frontend shell, API client, React Query hooks, Stats cards, Filtered/Paginated list | 65 min | 3h 20m |
| **Phase 5** | Create Ticket form with live validation, Detail page, Inline status/priority updates | 50 min | 4h 10m |
| **Phase 6** | Responsive/accessibility pass, frontend tests, browser screenshots | 45 min | 4h 55m |
| **Phase 7** | Production build, Express static/SPA serving, README, deployment config | 30 min | 5h 25m |
| **Buffer** | Testing buffer and bonus items (optimistic updates, GitHub Actions CI) | 35 min | **6h 00m** |

**Feasibility Verdict**: **PASS**. Scope is well-calibrated and easily completed within the 6-hour limit with a 35-minute contingency buffer.

---

## 5. Interview Readiness Check (`docs/09-EXTENDING.md`)

- `docs/09-EXTENDING.md` provides complete, step-by-step walkthroughs for:
  1. Adding a new field (`category`) across all layers (shared schema, DB migration, repository, seed, UI filters, badges, tests).
  2. Adding a new status (`Closed`) with CHECK constraint migration considerations.
  3. Adding a new filter (date range filtering).
- Files and paths in `docs/09-EXTENDING.md` match the monorepo layout in `docs/03-ARCHITECTURE.md`.
- Invariant rules (schema first, parameterized SQL, URL state sync) are clearly documented.

**Verdict**: **PASS**.

---

## 6. Deployment Sanity Check (`docs/11-DEPLOYMENT.md`)

- Single service architecture on Render running native Node 20.
- Honest caveat regarding Render free-tier ephemeral storage: SQLite database resets on container restart/redeploy.
- Automatic seeding mechanism: On startup, `seed(ifEmpty = true)` checks row count; if 0, it seeds all 36 tickets, ensuring the reviewer always has demo data.
- Documented production upgrade paths: Render persistent disk or PostgreSQL via repository swap.
- Local production simulation (`npm run build && npm start`) clearly documented.

**Verdict**: **PASS**.

---

## 7. Audit Summary & Readiness Verdict

All requirements are covered, edge cases are guarded, and all documentation contradictions have been resolved directly in the documents.

**VERDICT**: **READY TO BUILD**

---

## 8. Fix-Up Log

| Item # | Target File(s) | What Changed |
|:------:|----------------|--------------|
| **1** | `docs/03-ARCHITECTURE.md`, `docs/05-DATA-MODEL.md`, `docs/06-PHASES.md`, `docs/09-EXTENDING.md`, `AGENTS.md`, `CLAUDE.md` | Locked migrations directory to `apps/api/migrations/` (outside `src/`). Documented runner resolution relative to the api package root with `process.env.MIGRATIONS_DIR` override across tsx dev, tests, and production bundle. |
| **2** | `docs/03-ARCHITECTURE.md`, `docs/06-PHASES.md`, `docs/11-DEPLOYMENT.md`, `AGENTS.md`, `CLAUDE.md` | Locked build/run strategy: `packages/shared` consumed as TS source (`src/index.ts`); API dev uses `tsx watch`; production uses `tsup` bundling shared into `apps/api/dist/server.js` (ESM) with `better-sqlite3` and `node_modules` externalized; `.sql` migrations read from disk at runtime; web uses `vite build`; root `npm start` executes `node apps/api/dist/server.js`; static `apps/web/dist` path resolved relative to server bundle (`import.meta.url`); documented committing `package-lock.json` for Render `npm ci`. |
| **3** | `docs/03-ARCHITECTURE.md`, `docs/06-PHASES.md`, `AGENTS.md`, `CLAUDE.md` | Documented Express 5 specifics: (a) `req.query` is read-only getter, validation middleware stores parsed inputs on `res.locals.validated` and routers read from there; (b) `req.body` is `undefined` when empty, so validation treats `undefined` as `{}` so empty PATCH returns 400 `VALIDATION_ERROR`, never 500. |
| **4** | `docs/03-ARCHITECTURE.md`, `docs/06-PHASES.md`, `docs/11-DEPLOYMENT.md`, `AGENTS.md`, `CLAUDE.md` | Replaced all `GET *` routes with plain SPA fallback middleware registered after `express.static` and `/api` routes (GET/HEAD only, skips `/api`, serves `index.html`). Noted bare `'*'` is invalid in Express 5. |
| **5** | `docs/03-ARCHITECTURE.md`, `docs/05-DATA-MODEL.md`, `docs/07-TEST-PLAN.md`, `AGENTS.md`, `CLAUDE.md` | Implemented injectable clock pattern: service generates timestamps via `now()` dependency (default `() => new Date().toISOString()`) and passes to repository; `createApp(deps)` accepts `{ db, now }`; seed supplies fixed timestamps; update sets `updated_at = ?`; tests U3 (clock advance) and U4 (createdAt immutable) assert timestamp mechanics deterministically. |
| **6** | `docs/04-API-SPEC.md`, `docs/06-PHASES.md`, `docs/01-requirements-traceability.md`, `AGENTS.md`, `CLAUDE.md` | Locked list query semantics: empty-string `search`/`status`/`priority` treated as absent; `search` trimmed, whitespace-only = absent, max 100 chars (longer -> 400); repeated parameters (arrays) -> 400. |
| **7** | `docs/04-API-SPEC.md`, `docs/06-PHASES.md`, `docs/01-requirements-traceability.md` | Locked pagination rule: `pagination.totalPages = Math.ceil(total / 10)` which is 0 when total is 0 (UI renders "Page 1 of 1"); out-of-range pages return 200 with `data: []` and correct total counts. |
| **8** | `docs/04-API-SPEC.md`, `docs/06-PHASES.md`, `docs/01-requirements-traceability.md`, `AGENTS.md`, `CLAUDE.md` | Locked POST and PATCH behaviors: POST strips unknown fields (client cannot set id/timestamps); PATCH strictly rejects unknown fields and empty body; PATCH with unchanged values returns 200 and refreshes `updatedAt`. |
| **9** | `docs/02-PRD.md`, `docs/06-PHASES.md`, `docs/01-requirements-traceability.md`, `AGENTS.md`, `CLAUDE.md` | Documented post-creation navigation: UI navigates directly to `/tickets/:id` (US-1). Detail page back link explicitly preserves the previous list URL query parameters (US-7, Phase 5). |
| **10** | `docs/07-TEST-PLAN.md`, `docs/01-requirements-traceability.md` | Added tests: C1, C2, L12, L13, L14, L15, L16, U8, U9, S0, S3, D1, D2, D3, F6, F7, F8. Recomputed total tests to 56 (48 API tests, 8 frontend tests) and removed outdated "14+" header text. |
| **11** | `docs/06-PHASES.md`, `docs/08-SUBMISSION-CHECKLIST.md`, `AGENTS.md`, `CLAUDE.md` | Updated exit gates: Phase 3 exit requires every API test in `docs/07` to be implemented and green (48 tests); Phase 6 exit requires every frontend test in `docs/07` to be green (8 tests). |
| **12** | `docs/01-requirements-traceability.md` | Added traceability table rows R-34 (query sanitization), R-35 (pagination calculation), R-36 (POST stripping & strict PATCH), R-37 (navigation & back link URL state), and R-38 (full 56 test suite). |
| **13** | `docs/*`, `AGENTS.md`, `CLAUDE.md` | Audited and verified zero occurrences of forbidden strings ("GET *", "src/db/migrations", ":3000", "14+", "req.query ="). Synchronized `AGENTS.md` and `CLAUDE.md` to be 100% identical and include items 1-5 as rules. |

