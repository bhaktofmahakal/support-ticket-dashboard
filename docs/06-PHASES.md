# Build Phases

Total budget: **6 hours** (5h 25m core build + 35m buffer).  
Structured into 7 sequential phases aligned with development milestones and strict verification exit gates.

---

## Phase 1 — Scaffold + Database + Seed (45 min)

- [ ] **Workspace Setup**:
  - npm workspaces monorepo: `apps/api`, `apps/web`, `packages/shared`.
  - `packages/shared` is configured to be consumed directly as TypeScript source (`main`, `types`, and `exports` point to `src/index.ts`).
  - Tooling: TypeScript strict mode across workspaces, ESLint, Prettier, `.gitignore`, `.nvmrc` (Node 20), `.env.example` (`PORT=3001`, `DATABASE_PATH=./data/tickets.db`, `MIGRATIONS_DIR=./migrations`).
  - Root scripts: `setup`, `dev`, `build`, `start`, `test`, `test:api`, `test:web`, `typecheck`, `lint`.
- [ ] `packages/shared`:
  - Zod schemas and TypeScript types: `ticketSchema`, `createTicketSchema`, `updateTicketSchema`, `querySchema`, `paginationSchema`, `errorResponseSchema`, enums `ticketStatusEnum`, `ticketPriorityEnum`.
- [ ] `apps/api`:
  - Config loader (`DATABASE_PATH`, `PORT`, `MIGRATIONS_DIR`).
  - `better-sqlite3` connection factory (supports `:memory:`, WAL mode enabled).
  - Versioned migration runner reading `.sql` files from `apps/api/migrations/` (outside `src/`, resolved relative to API package root or `MIGRATIONS_DIR` env override). Tracks applied migrations in `schema_migrations`.
  - Migration `apps/api/migrations/001_create_tickets.sql` with CHECK constraints and indexes on `status`, `priority`, `created_at`.
  - Idempotent seed script (`apps/api/src/db/seed.ts`): 36 benchmark tickets with varied status/priority, duplicate fixed timestamps, mixed-case email, shared domain, 120-char title. Only inserts if table is empty; includes `--reset` flag.
  - Ticket repository (`apps/api/src/repository/ticket.repository.ts`): `create`, `findById`, `list(query)`, `updateStatusPriority`, `stats`. All SQL strictly parameterized; LIKE queries escape wildcards (`%`, `_`, `\`) with `ESCAPE '\'`; stable sort tie-breaker `ORDER BY created_at <DIR>, id <DIR>`.
- [ ] No HTTP routes yet; Phase 1 is data layer only.

**Exit Gate**:
- `npm install` succeeds cleanly.
- `npm run typecheck` and `npm run lint` pass.
- `npm run setup` creates DB with 36 rows; running again keeps 36 rows (idempotent).
- Repository smoke test script confirms `list` handles search, filters, sort, pagination, and `stats` returns correct counts.
- Git commit: `chore: scaffold monorepo, database migrations, and seed data`

---

## Phase 2 — REST API Endpoints & Middleware (50 min)

- [ ] Express application factory `createApp(deps: { db, now? })` allowing tests to inject in-memory database instances and fake clocks (`now()`); separate `src/server.ts` entry for runtime listening.
- [ ] Strict layering: Router (HTTP concerns only) → Service (business rules & injectable clock) → Repository (pure SQL).
- [ ] **Express 5 Specifics**:
  - `req.query` is a read-only getter: validation middleware stores parsed/sanitized query, body, and params on `res.locals.validated` (`res.locals.validated.query`, `res.locals.validated.body`, `res.locals.validated.params`). Routers read strictly from `res.locals.validated`.
  - `req.body` is `undefined` when no body is sent: validation middleware treats `req.body === undefined` as `{}` so an empty PATCH body returns 400 `VALIDATION_ERROR`, never 500.
- [ ] Endpoints per `docs/04-API-SPEC.md`:
  - `GET /api/health` → 200 `{ status: "ok", timestamp }`
  - `POST /api/tickets` → 201 `{ data: Ticket }` (unknown fields stripped; id/createdAt/updatedAt cannot be set by client)
  - `GET /api/tickets` → 200 `{ data: Ticket[], pagination }` (empty strings treated as absent; repeated params rejected with 400; max search 100 chars; totalPages=0 when total=0)
  - `GET /api/tickets/stats` → 200 `{ data: { total, open, inProgress, resolved } }` (registered BEFORE `/:id`, ignores all query params)
  - `GET /api/tickets/:id` → 200 `{ data: Ticket }` or 404
  - `PATCH /api/tickets/:id` → 200 `{ data: Ticket }` (strict: unknown fields → 400, empty body → 400; unchanged values return 200 and bump updatedAt)
- [ ] Central error handler producing `{ error: { code, message, details? } }`:
  - `VALIDATION_ERROR` (400)
  - `NOT_FOUND` (404 for missing ticket or unknown `/api` route)
  - `INTERNAL_ERROR` (500 without leaking stack traces)
  - Catches malformed JSON syntax errors → 400.
- [ ] Security & Logging: `helmet`, JSON body limit (100kb), CORS for dev, quiet logging in test environment.

**Exit Gate**:
- Every endpoint tested with `curl` / HTTP client showing documented status codes and shapes.
- Stats endpoint returns correct unfiltered counts during active list queries.
- `npm run typecheck` and `npm run lint` pass.
- Git commit: `feat(api): implement express routes, service layer, and validation middleware`

---

## Phase 3 — Backend Test Suite (40 min)

- [ ] Vitest + Supertest configuration in `apps/api`.
- [ ] Test helper for in-memory SQLite (`:memory:`) with migrations applied from `apps/api/migrations/` per test.
- [ ] Complete implementation of all 48 API tests from `docs/07-TEST-PLAN.md`:
  - Creation & Stripping (C1, C2)
  - Validation (V1..V11)
  - List & Query (L1..L16)
  - Update & Clock (U1..U9, fake clock for U3, immutability check for U4)
  - Stats (S0..S3, empty DB test S0, mutation test S3)
  - Error Handling (E1..E3)
  - Database, Seed & Migrations (D1..D3)
- [ ] Mutation sanity check: temporarily remove LIKE escaping or tie-breaker to prove tests catch mutations.

**Exit Gate**:
- **Every API test listed in `docs/07-TEST-PLAN.md` is implemented and green** (all 48 tests pass).
- Mutation tests catch intentionally modified logic.
- Git commit: `test(api): add comprehensive test suite for validation, queries, and updates`

---

## Phase 4 — Frontend Foundation, Dashboard & List (65 min)

- [ ] App shell in `apps/web`: responsive layout, header with logo & "New Ticket" button, Tailwind theme tokens, accessible status/priority badges.
- [ ] Typed API client using shared types; parses standard `{ error }` payload into `ApiError`.
- [ ] TanStack Query setup: `useTickets(params)`, `useTicketStats()`, `placeholderData: keepPreviousData`.
- [ ] Summary stats cards (Total, Open, In Progress, Resolved) powered by `/api/tickets/stats` with loading skeletons.
- [ ] Ticket listing:
  - Search bar with 300ms debouncing.
  - Status and Priority filter dropdowns.
  - Sort direction toggle (Newest / Oldest).
  - Pagination controls (Prev / Next, Page X of Y, total records; displays "Page 1 of 1" when total=0).
  - Full URL query params synchronization (`useUrlState` hook): reading on load, updating on change, resetting page to 1 on filter changes.
  - Semantic HTML table on desktop (≥768px), stacked cards on mobile (<768px).
- [ ] UI states: skeleton loading, empty state ("No tickets yet" with CTA), no-match state ("No tickets found" with Clear Filters CTA), error state with retry button.

**Exit Gate**:
- Real browser verification at 375px, 768px, and 1280px.
- Verified search debouncing, URL state persistence across page reload, filter reset behavior, and distinct empty states.
- No console errors or warnings.
- Git commit: `feat(web): implement dashboard, stats cards, and filterable ticket list`

---

## Phase 5 — Create Ticket Form, Detail View & Inline Update (50 min)

- [ ] Create Ticket page (`/tickets/new`):
  - Form fields: Title (with live `x/120` character counter), Description (textarea), Customer Email, Priority dropdown.
  - Client-side validation using shared Zod schema on blur and submit.
  - Inline error messages associated via `aria-describedby`.
  - Submit button disabled with spinner during request.
  - Server validation errors (400 details) mapped back to respective fields.
  - On success: display toast notification and **navigate immediately to `/tickets/:id`**; invalidate stats + tickets queries.
- [ ] Ticket Detail page (`/tickets/:id`):
  - Displays full ticket details (formatted timestamps with full ISO in title, preserved description line breaks).
  - **Back Link**: Preserves the previous list URL query string so the user returns to their exact filtered list view.
  - Inline dropdowns to update Status and Priority.
  - Immediate `PATCH` call with optimistic or loading feedback.
  - On error: rollback to previous value + error toast.
  - On success: toast confirmation, updated timestamp refreshes, invalidates stats and list caches.
  - 404 state for non-existent ticket ID.
- [ ] Accessible Toast notifications (`aria-live="polite"`, auto-dismiss after 4s).

**Exit Gate**:
- Verified in browser: field validation errors, 120-char boundary, valid creation navigating to `/tickets/:id`, back link preserving filter query parameters, inline updates persisting after hard refresh, 404 handling.
- No console errors.
- Git commit: `feat(web): add ticket creation form, detail view, and inline updates`

---

## Phase 6 — Polish, Accessibility, Frontend Tests & Screenshots (45 min)

- [ ] Responsive inspection: ensure tap targets ≥40px, no horizontal scroll at 360px/375px/768px/1280px.
- [ ] Accessibility pass: keyboard navigation flow, visible focus rings, ARIA live regions, semantic tables, contrast ratios.
- [ ] Frontend tests (`apps/web/src/__tests__/frontend.test.tsx`):
  - F1: form shows validation errors for invalid input.
  - F2: form disables submit while pending.
  - F3: list renders loading skeleton.
  - F4: list renders empty state when no tickets.
  - F5: stats cards render correct counts.
  - F6: changing a filter writes URL params and resets page to 1.
  - F7: no-match state shows Clear filters button.
  - F8: error state shows Retry button.
- [ ] Capture automated/browser screenshots in `docs/screenshots/`:
  - Dashboard desktop (`01-dashboard-desktop.png`)
  - Dashboard mobile (`02-dashboard-mobile.png`)
  - Ticket list filtered (`03-list-filtered.png`)
  - Empty / No-match state (`04-no-match.png`)
  - Create form validation errors (`05-create-validation.png`)
  - Ticket detail desktop & mobile (`06-detail-desktop.png`, `07-detail-mobile.png`)

**Exit Gate**:
- **Every frontend test listed in `docs/07-TEST-PLAN.md` is green** (all 8 frontend tests pass).
- All 56 automated tests pass (`npm test`).
- Screenshots saved and verified.
- Git commit: `test(web): add component tests, a11y polish, and screenshots`

---

## Phase 7 — Production Build, README & Deployment (30 min)

- [ ] Production Build Configuration:
  - `tsup` bundles `apps/api/src/server.ts` with inlined `packages/shared` into `apps/api/dist/server.js` (ESM). `better-sqlite3` and `node_modules` externalized.
  - `apps/api/migrations/` .sql files are read at runtime from disk relative to package root.
  - `apps/web` built with `vite build` into `apps/web/dist`.
  - Static file path resolved relative to the server bundle location (`import.meta.url`), not `process.cwd()`.
  - Root `npm start` runs `node apps/api/dist/server.js` from the repository root.
- [ ] SPA Fallback Middleware:
  - Registered after `express.static` and after all `/api` routes.
  - Handles `GET`/`HEAD` requests that do not start with `/api` and serves `apps/web/dist/index.html`.
  - Avoids bare `'*'` (invalid in Express 5).
  - Unmatched `/api/*` routes fall through to the JSON 404 handler.
- [ ] Deployment & Repository Config:
  - `package-lock.json` committed for deterministic `npm ci` on Render.
  - `render.yaml` configured for native Node 20.
- [ ] `README.md` complete with all sections required by assignment:
  - Setup steps, environment variables, test execution.
  - Technical choices, assumptions, known limitations.
  - Time spent breakdown table.
  - AI tools usage disclosure.
  - Screenshots strip.
- [ ] `docs/WALKTHROUGH.md` documenting file architecture and interview live-change guides.

**Exit Gate**:
- Fresh checkout simulation: running setup and production start serves the application flawlessly.
- All 56 tests, typechecking, and linting pass.
- Git commit: `docs: complete README, production build scripts, and deployment config`

---

## Time Budget Summary

| Phase | Description | Duration | Cumulative |
|-------|-------------|:--------:|:----------:|
| Phase 1 | Monorepo scaffolding, database, seed, repository | 45m | 0:45 |
| Phase 2 | Express API endpoints, validation, error handler | 50m | 1:35 |
| Phase 3 | Backend tests (Vitest + Supertest, 48 tests) | 40m | 2:15 |
| Phase 4 | Frontend shell, dashboard, stats, filterable list | 65m | 3:20 |
| Phase 5 | Create form, detail page, inline PATCH updates | 50m | 4:10 |
| Phase 6 | Responsive & a11y polish, frontend tests, screenshots | 45m | 4:55 |
| Phase 7 | Production build, static serving, README, deploy | 30m | 5:25 |
| **Buffer** | **Testing buffer & bonus items** | **35m** | **6:00** |
| **Total** | **Max 6 Hours** | **6h 00m** | **Under 6h ✓** |
