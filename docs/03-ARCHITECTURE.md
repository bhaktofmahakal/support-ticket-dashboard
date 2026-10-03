# Architecture

## Monorepo Layout

```
support-ticket-dashboard/
├── apps/
│   ├── api/                        # Express backend
│   │   ├── migrations/             # SQL migrations (outside src, read at runtime)
│   │   │   └── 001_create_tickets.sql
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── connection.ts   # DB singleton, WAL mode
│   │   │   │   ├── migrate.ts      # Migration runner (MIGRATIONS_DIR override)
│   │   │   │   └── seed.ts         # 36 idempotent tickets (fixed timestamps)
│   │   │   ├── repository/
│   │   │   │   └── ticket.repository.ts  # SQL queries, parameterized
│   │   │   ├── service/
│   │   │   │   └── ticket.service.ts     # Business logic + injectable now()
│   │   │   ├── routes/
│   │   │   │   ├── tickets.ts            # Router (reads res.locals.validated)
│   │   │   │   └── health.ts
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.ts      # Global error middleware
│   │   │   │   ├── validate.ts           # Zod validation -> res.locals.validated
│   │   │   │   ├── not-found.ts          # 404 catch-all for /api
│   │   │   │   └── spa-fallback.ts       # SPA fallback (non-/api GET/HEAD only)
│   │   │   ├── errors/
│   │   │   │   └── app-error.ts          # Custom error classes
│   │   │   ├── app.ts                    # createApp(deps: { db, now? })
│   │   │   └── server.ts                 # Entry: migrate, seed, listen
│   │   ├── tsup.config.ts          # Bundles shared into dist/server.js (ESM)
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── web/                        # Vite + React frontend
│       ├── src/
│       │   ├── api/
│       │   │   └── tickets.ts      # Fetch wrappers (typed)
│       │   ├── components/
│       │   │   ├── StatsCards.tsx
│       │   │   ├── TicketTable.tsx
│       │   │   ├── TicketCard.tsx   # Mobile card variant
│       │   │   ├── TicketForm.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   ├── FilterBar.tsx
│       │   │   ├── Pagination.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── PriorityBadge.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── ErrorState.tsx
│       │   │   └── Toast.tsx
│       │   ├── hooks/
│       │   │   ├── useTickets.ts
│       │   │   ├── useTicketStats.ts
│       │   │   ├── useDebounce.ts
│       │   │   └── useUrlState.ts
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx    # List + stats + filters
│       │   │   ├── TicketDetail.tsx # Detail view + status/priority edit
│       │   │   └── CreateTicket.tsx # Form with validation
│       │   ├── lib/
│       │   │   └── query-client.ts
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css           # Tailwind directives
│       ├── index.html
│       ├── tailwind.config.ts
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── package.json
├── packages/
│   └── shared/                     # Shared zod schemas + types (consumed as TS source)
│       ├── src/
│       │   ├── schemas/
│       │   │   └── ticket.ts       # createTicketSchema, updateTicketSchema, querySchema
│       │   ├── types/
│       │   │   └── ticket.ts       # Inferred TS types
│       │   └── index.ts            # Barrel export
│       ├── tsconfig.json
│       └── package.json
├── docs/                           # Design & specification docs
├── .nvmrc                          # 20
├── .gitignore
├── package.json                    # Workspace root + orchestration scripts
├── tsconfig.base.json
├── render.yaml
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

---

## Build & Run Strategy

1. **Shared Package Consumption**:
   - `packages/shared` is consumed directly as TypeScript source.
   - `packages/shared/package.json` specifies `"main": "./src/index.ts"`, `"types": "./src/index.ts"`, and `"exports": { ".": "./src/index.ts" }`.
   - No separate build step is needed for `packages/shared` during development or testing.
2. **API Development Mode**:
   - Uses `tsx watch src/server.ts` for fast TypeScript execution and hot reloading.
3. **API Production Build**:
   - Uses `tsup` to bundle the Express application and inlined `packages/shared` into `apps/api/dist/server.js` as an ESM bundle.
   - Dependencies in `node_modules` (including `better-sqlite3`, `express`) are externalized.
   - `.sql` migration files in `apps/api/migrations` are **not** bundled into JS; they are read from disk at runtime.
4. **Migrations Directory Resolution**:
   - The migration runner resolves the directory relative to the `api` package root (with `process.env.MIGRATIONS_DIR` as an optional override).
   - This ensures migrations are reliably located under `tsx` (in `apps/api`), under Vitest test runs, and in the bundled `apps/api/dist/server.js`.
5. **Web Production Build**:
   - Built via `vite build`, outputting static assets to `apps/web/dist`.
6. **Production Serving**:
   - Root `npm start` executes `node apps/api/dist/server.js` from the repository root.
   - The static path for `apps/web/dist` is resolved relative to the server bundle location (`import.meta.url` or `fileURLToPath`), not `process.cwd()`.

---

## Layered Architecture (API)

```
Request → Router → validate(zodSchema) → Service → Repository → SQLite
                                                                    ↓
Response ← error-handler ← Service ← Repository ← ← ← ← ← ← ← ←
```

- **Router**: HTTP concerns only — reads validated parameters from `res.locals.validated`, calls service, sends response with status code.
- **Service**: Business logic — coordinates repository calls, generates timestamps via injectable `now()`, throws typed `AppError` on violations.
- **Repository**: Pure SQL — parameterized queries, returns plain objects. Zero HTTP awareness. Accepts timestamps as arguments.
- **Middleware**: Cross-cutting concerns — Zod validation (writing to `res.locals.validated`), error handling, 404 catch-all, SPA fallback.

### Injectable Clock Pattern

- To guarantee deterministic testing and avoid race conditions in timestamp verification, timestamps are generated in the service layer using an injectable clock dependency:
  ```typescript
  type NowFn = () => string;
  // Default: () => new Date().toISOString()
  ```
- `createApp(deps)` accepts `{ db, now?: NowFn }`.
- In production, `now()` defaults to ISO UTC strings (`new Date().toISOString()`).
- In tests, a fake clock can advance time deterministically to assert `updatedAt` changes while `createdAt` remains immutable.
- Seed scripts supply explicit fixed ISO timestamps (including deliberate duplicates for sort tie-breaker testing).
- SQLite table defaults (`strftime(...)`) remain strictly as a defense-in-depth database fallback.
- `UPDATE` statements strictly parameterize `updated_at = ?`.

---

## Express 5 Specifics & Safeguards

Express 5 introduces breaking changes from Express 4 that require strict conventions:

1. **`req.query` is a Read-Only Getter**:
   - In Express 5, `req.query` cannot be reassigned (attempting to assign directly to `req.query` throws a TypeError).
   - **Convention**: Validation middleware parses input and stores sanitized/coerced values on `res.locals.validated`:
     ```typescript
     res.locals.validated = {
       body: parsedBody,
       query: parsedQuery,
       params: parsedParams,
     };
     ```
   - Routers read exclusively from `res.locals.validated.query`, `res.locals.validated.body`, and `res.locals.validated.params`.
2. **`req.body` is `undefined` When Body is Empty**:
   - In Express 5 with `express.json()`, an HTTP request with no body sets `req.body` to `undefined` (not `{}`).
   - **Convention**: Validation middleware must treat `req.body === undefined` as `{}` prior to schema parsing so that an empty PATCH request triggers a `400 VALIDATION_ERROR` rather than an unhandled 500 error.
3. **SPA Fallback Without Wildcard Route (`*`)**:
   - In Express 5 (`path-to-regexp` v8), bare `'*'` or `/*` route patterns are invalid and throw errors.
   - **Convention**: SPA fallback is implemented as a standard middleware function registered **after** `express.static` and all `/api` routes:
     ```typescript
     app.use((req, res, next) => {
       if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
         return res.sendFile(indexPath);
       }
       next();
     });
     ```
   - Any request matching `/api/*` that is not handled by the router falls through to the `/api` 404 JSON handler.

---

## Data Flow

### Create Ticket
```
POST /api/tickets → validate(createTicketSchema) → service.create(body, now())
  → repo.insert({ ...body, createdAt: now(), updatedAt: now() })
  → DB INSERT → return row → 201 + { data: ticket }
```

### List Tickets
```
GET /api/tickets?search=&status=&priority=&sort=newest&page=1
  → validate(querySchema) → service.list(res.locals.validated.query)
  → repo.findMany(query)  → DB SELECT with WHERE/ORDER/LIMIT/OFFSET
  → repo.count(query)     → DB SELECT COUNT
  → return { data, pagination: { page, pageSize: 10, total, totalPages } } → 200
```

### Stats (always unfiltered)
```
GET /api/tickets/stats → service.getStats()
  → repo.getStats() → DB SELECT COUNT GROUP BY status
  → return { data: { total, open, inProgress, resolved } } → 200
```

### Update Ticket
```
PATCH /api/tickets/:id → validate(updateTicketSchema) → service.update(id, body, now())
  → repo.findById(id)      → 404 if not found
  → repo.update(id, body, now())  → DB UPDATE SET ... updated_at = ?
  → return updated row     → 200 + { data: ticket }
```

---

## Pinned Dependency Versions

| Package | Version | Why this version |
|---------|---------|-----------------|
| express | `^5.1.0` | Express 5 stable; native async error handling, no need for express-async-errors. |
| better-sqlite3 | `^12.6.2` | Latest stable SQLite3 engine with synchronous WAL mode. |
| zod | `^3.24.2` | Battle-tested validation library. |
| @tanstack/react-query | `^5.90.3` | Stable data fetching with `placeholderData: keepPreviousData`. |
| react-router-dom | `^6.30.3` | Stable declarative routing with `useSearchParams`. |
| react | `^19.1.0` | React 19 stable. |
| react-dom | `^19.1.0` | React 19 DOM bindings. |
| vite | `^6.3.5` | Vite 6 build tool and dev server. |
| tsup | `^8.5.0` | Fast TypeScript bundler for node server bundling shared package. |
| tsx | `^4.19.3` | TypeScript watcher and runner for development. |
| typescript | `^5.8.3` | TypeScript compiler. |
| vitest | `^3.2.4` | Vitest testing framework. |
| @testing-library/react | `^16.3.0` | Component testing utilities. |
| supertest | `^7.1.0` | Integration testing HTTP assertions. |
| tailwindcss | `^3.4.17` | Tailwind CSS v3 stable. |
| concurrently | `^9.1.2` | Concurrently runs API and web servers in dev. |
| @types/express | `^5.0.2` | Type definitions for Express 5. |
| @types/better-sqlite3 | `^7.6.12` | Latest stable type definitions. |

---

## Frontend Design System & Theme Architecture

The frontend styling strictly adheres to `DESIGN.md` and `docs/12-DESIGN-ADAPTATION.md`:

1. **Token Layer (`apps/web/src/index.css`)**:
   - Defines CSS variables on `:root` backing the token map:
     - Surfaces: `--color-background` (`#010102`), `--color-surface` (`#0f1011`), `--color-surface-raised` (`#141516`), `--color-surface-overlay` (`#18191a`).
     - Borders: `--color-border` (`#23252a`), `--color-border-strong` (`#34343a`).
     - Typography colors: `--color-text-primary` (`#f7f8f8`), `--color-text-secondary` (`#d0d6e0`), `--color-text-muted` (`#8a8f98`), `--color-text-disabled` (`#7c8089`).
     - Accent & Focus: `--color-accent` (`#5e6ad2`), `--color-accent-hover` (`#828fff`), `--color-accent-focus` (`#5e69d1`), `--color-focus-ring` (`rgba(94, 105, 209, 0.5)`).
     - Semantic: `--color-success` (`#27a644`), `--color-warning` (`#f2994a`), `--color-danger` (`#eb5757`), plus respective tinted surface fills and borders.
2. **Tailwind Extension (`apps/web/tailwind.config.ts`)**:
   - `tailwind.config.ts` extends theme colors directly mapped to CSS variables (`background: 'var(--color-background)'`, `surface: 'var(--color-surface)'`, etc.).
   - Extends font families with `sans: ['Inter', ...]` and `mono: ['JetBrains Mono', ...]`.
   - Maps border radii tokens (`xs: '4px'`, `sm: '6px'`, `md: '8px'`, `lg: '12px'`, `xl: '16px'`).
3. **Self-Hosted Typography (`apps/web/src/main.tsx`)**:
   - Bundles `@fontsource/inter` (weights 400, 500, 600) and `@fontsource/jetbrains-mono` (weight 400).
   - Zero external Google Fonts or CDN requests.

---

### Node Version
Pinned via `.nvmrc`: `20`
