# Project Rules & Agent Guidelines

> **IMPORTANT**: Read `docs/` completely before proposing, writing, or modifying any code. The locked decisions in `docs/` are law. If you believe a locked decision is flawed, stop and explain why before changing anything.

---

## 1. Project Overview & Architecture

- **Project**: Support Ticket Dashboard (Take-home Full-Stack Web Application)
- **Monorepo Layout**: `apps/api` (Express backend), `apps/web` (Vite + React frontend), `packages/shared` (Shared Zod schemas and TypeScript types consumed as TS source)
- **Language & Runtime**: TypeScript (strict mode everywhere), Node.js ≥ 20 LTS (pinned via `.nvmrc`)
- **Backend Architecture**: Layered separation:
  - `routes/` (HTTP only, reads validated inputs from `res.locals.validated`, calls service, returns JSON with HTTP status)
  - `service/` (Business rules, orchestrates repository calls, generates timestamps via injectable `now()`, throws typed errors)
  - `repository/` (Pure parameterized SQL via `better-sqlite3`, returns plain data objects, zero HTTP awareness)
  - `middleware/` (Centralized Zod validation storing to `res.locals.validated`, error handling, 404 handler, SPA fallback)
- **Frontend Architecture**:
  - React 19 + Vite 6 + Tailwind CSS v3 + React Router v6 + TanStack Query v5
  - URL Query Parameters as single source of truth for list filters, search, sort, and pagination
  - Accessible design: semantic HTML, visible focus states, ARIA attributes, color is never the sole indicator of state

---

## 2. Standard Commands (Root `package.json`)

All commands must be runnable from the root workspace:

```bash
# Setup: Installs dependencies, runs SQLite migrations, seeds 36 benchmark tickets
npm run setup

# Development: Concurrently starts API on :3001 and Vite dev server on :5173 (with /api proxy)
npm run dev

# Testing: Runs all Vitest test suites (48 API tests + 8 frontend tests = 56 total)
npm test
npm run test:api
npm run test:web

# Validation: Runs linting and strict TypeScript typechecking across all packages
npm run lint
npm run typecheck

# Production Build: Builds packages/shared, apps/api (tsup to dist/server.js), and apps/web (vite)
npm run build

# Production Start: Migrates DB, seeds if empty, starts Express serving API and static web app
npm start
```

---

## 3. Strict Coding Conventions & Quality Rules

1. **Simple, Explainable Code**:
   - Write clean, idiomatic TypeScript with small, single-purpose functions.
   - Avoid complex abstraction layers or heavy utility libraries. Every line of code must be immediately explainable in a technical interview.
2. **Never Leak Errors or Stack Traces**:
   - Central error handler must catch all errors and format them into the standard error shape:
     ```json
     {
       "error": {
         "code": "VALIDATION_ERROR | NOT_FOUND | INTERNAL_ERROR",
         "message": "Human readable error description",
         "details": [
           { "field": "title", "message": "Title must be at most 120 characters" }
         ]
       }
     }
     ```
   - Log raw stack traces to the server console, but NEVER send them over the wire.
3. **Database & SQL Safety**:
   - Every SQL query in the repository layer MUST be strictly parameterized. Never concatenate user strings into SQL.
   - For `LIKE` search queries, escape wildcard characters (`%`, `_`, `\`) and specify `ESCAPE '\'`.
   - Always include a deterministic tie-breaker in sorting: `ORDER BY created_at <DIR>, id <DIR>`.
4. **Validation & Strict Invariants**:
   - Validate request bodies, query parameters, and route parameters with Zod schemas defined in `packages/shared`.
   - `POST /api/tickets`: Strips unknown fields. Client cannot set `id`, `createdAt`, or `updatedAt`.
   - `PATCH /api/tickets/:id`: Strict validation: disallows unknown fields and rejects empty request bodies (`{}` or undefined) with 400. Unchanged values return 200 and bump `updatedAt`.
   - `GET /api/tickets`: Empty strings for `search`, `status`, `priority` treated as absent. Whitespace-only `search` treated as absent. Max search length 100 chars (longer -> 400). Repeated parameters (arrays) -> 400.
5. **No Placeholder UI & No Broken States**:
   - Every view must have explicit Loading (skeletons), Error (with retry), and Empty states.
   - Differentiate "No tickets exist" (shows Create CTA) from "No tickets match filters" (shows Clear Filters CTA).
   - After ticket creation, navigate immediately to `/tickets/:id`.
   - The ticket detail page back link must preserve the previous list URL query parameters.
   - Responsive layouts: Table on desktop (≥768px), stacked cards on mobile (verified down to 360px without horizontal scroll).
   - Zero console errors, warnings, or unhandled promise rejections.
6. **Design System & Visual Language**:
   - All UI follows `DESIGN.md` and `docs/12-DESIGN-ADAPTATION.md`.
   - No hardcoded colours, font sizes or radii in components. Use only Tailwind theme tokens backed by CSS variables.
   - Presentational changes must never alter props, hooks, API calls, URL param names, routes, form field names/ids/labels or aria attributes.

---

## 4. Architectural Rules (Build-Breakers & Safeguards)

1. **Migrations Location & Resolution**:
   - Migration `.sql` files are located in `apps/api/migrations/` (outside `src/`).
   - The migration runner resolves the directory relative to the `api` package root, with `process.env.MIGRATIONS_DIR` as an optional override.
   - Works consistently under `tsx` (dev), Vitest (tests), and bundled `apps/api/dist/server.js` (production).
2. **API Build & Run Strategy**:
   - `packages/shared` is consumed as TypeScript source (`main`, `types`, and `exports` point to `src/index.ts`).
   - Development uses `tsx watch src/server.ts`.
   - Production build uses `tsup` bundling shared into `apps/api/dist/server.js` (ESM), externalizing `better-sqlite3` and `node_modules` dependencies.
   - `.sql` migrations are NOT bundled; they are read from `apps/api/migrations/` at runtime.
   - Root `npm start` runs `node apps/api/dist/server.js` from the repo root.
   - The static assets path (`apps/web/dist`) is resolved relative to the server bundle location (`import.meta.url`), not `process.cwd()`.
   - `package-lock.json` must be committed to Git for deterministic `npm ci` on Render.
3. **Express 5 Specifics**:
   - **`req.query` is a read-only getter**: Validation middleware must NEVER assign to `req.query` or `req.params`. Parsed/coerced values must be stored on `res.locals.validated` (`body`, `query`, `params`), and route handlers read strictly from `res.locals.validated`.
   - **`req.body` is `undefined` when empty**: Validation middleware must treat `req.body === undefined` as `{}` so an empty PATCH returns 400 `VALIDATION_ERROR`, never 500.
4. **SPA Fallback Implementation**:
   - Do NOT use bare `'*'` or `/*` in Express 5 (`path-to-regexp` v8 treats bare `*` as invalid).
   - SPA fallback is implemented as a plain middleware registered **after** `express.static` and **after** all `/api` routes:
     ```typescript
     app.use((req, res, next) => {
       if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
         return res.sendFile(indexPath);
       }
       next();
     });
     ```
   - Unmatched `/api/*` routes fall through to the JSON 404 handler.
5. **Injectable Clock & Timestamps**:
   - Timestamps are generated in the service layer via an injectable `now()` clock dependency (default: `() => new Date().toISOString()`) and passed to repository `create` and `update`.
   - `createApp(deps)` accepts `{ db, now?: () => string }`.
   - SQLite table defaults `(strftime(...))` remain only as defense-in-depth database fallback.
   - Seed script passes explicit fixed ISO timestamps (including deliberate duplicates).
   - Update SQL sets `updated_at = ?`.
   - Test U3 advances a fake clock and asserts `updatedAt` is strictly greater; U4 asserts `createdAt` is unchanged.

---

## 5. Definition of Done (Exit Gate Checklist)

Before closing any phase or task:
- [ ] TypeScript strict typecheck passes (`npm run typecheck`).
- [ ] ESLint passes cleanly without warnings (`npm run lint`).
- [ ] All 56 automated tests pass (`npm test`):
  - Phase 3 exit gate: Every API test listed in `docs/07-TEST-PLAN.md` is green (all 48 tests).
  - Phase 6 exit gate: Every frontend test listed in `docs/07-TEST-PLAN.md` is green (all 8 tests).
- [ ] Visual and functional verification in a real browser (responsive at 375px and 1280px).
- [ ] No secrets, `.env`, or `.db` files committed to Git.
- [ ] Time spent logged in `docs/08-SUBMISSION-CHECKLIST.md`.
