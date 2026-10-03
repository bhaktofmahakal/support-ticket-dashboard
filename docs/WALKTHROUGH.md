# Codebase Walkthrough & Interview Guide

This guide is designed for technical interviewers and code reviewers. It covers the codebase file-by-file, illustrates end-to-end request lifecycles, and provides exact recipes for five common live-coding extension tasks.

---

## 1. Per-File Directory Map & Purpose

### Root Workspace
- `package.json`: Monorepo root configuration with npm workspaces (`packages/*`, `apps/*`), unified scripts (`setup`, `dev`, `build`, `start`, `test`, `typecheck`, `lint`).
- `render.yaml`: Infrastructure-as-code blueprint for Render Web Service deployment (Node runtime, build and start commands, health check).
- `tsconfig.json`: Base TypeScript configuration shared by all packages (strict mode, ESNext module resolution).
- `.nvmrc`: Pins Node.js runtime to `>=20.18.0` LTS for deterministic builds.
- `.gitignore`: Ensures `node_modules`, `dist`, `.env`, temporary SQLite `.db` files, and test coverage are never committed.

### `packages/shared` (Shared Domain Contracts & Validation)
- `package.json`: Declares package metadata, exporting TypeScript source directly without intermediate compilation.
- `tsconfig.json`: Shared package TypeScript settings.
- `src/index.ts`: Central export point for all Zod schemas, TypeScript types, and domain constants.
- `src/schemas/ticket.ts`: Zod validation schemas for Ticket domain: `ticketSchema`, `createTicketSchema`, `updateTicketSchema`, `querySchema`, `statsSchema`, `errorResponseSchema`.
- `src/types/ticket.ts`: Inferred TypeScript types (`Ticket`, `CreateTicketInput`, `UpdateTicketInput`, `ListQuery`, `TicketStats`, `ErrorResponse`, etc.).

### `apps/api` (Express 5 REST API & SQLite Persistence)
- `package.json`: Backend dependencies (`better-sqlite3`, `express`, `cors`, `helmet`, `zod`, `tsup`, `tsx`).
- `tsup.config.ts`: Production bundle configuration; inlines `@support-ticket/shared` into ESM `dist/server.js` while externalizing native `better-sqlite3` and `node_modules`.
- `migrations/001_create_tickets.sql`: Initial database migration defining `tickets` table, check constraints, default timestamps, and composite performance indexes.
- `src/server.ts`: Production entry point; runs migrations, seeds benchmark data if empty, and boots Express on `process.env.PORT`.
- `src/app.ts`: Express application factory (`createApp`); sets up Helmet, CORS, body parsing, routes, static file serving (`apps/web/dist`), SPA fallback middleware, and global error handling.
- `src/config.ts`: Centralized environment variable parsing and defaults (`PORT`, `DATABASE_PATH`, `NODE_ENV`).
- `src/db/connection.ts`: Factory for creating and managing `better-sqlite3` database connections with WAL mode enabled.
- `src/db/migrate.ts`: Migration runner; reads SQL files from `apps/api/migrations` and tracks applied migrations in `schema_migrations`.
- `src/db/seed.ts`: Benchmark seeder; inserts 36 realistic tickets with varied statuses, priorities, and edge cases (120-char title, identical timestamps).
- `src/scripts/setup.ts`: CLI script executed by `npm run setup`; sequentially runs migrations and benchmark seeding.
- `src/repository/ticket.repository.ts`: Pure parameterized SQLite data access layer; handles SQL query construction, LIKE wildcard escaping, sorting tie-breakers, and pagination.
- `src/service/ticket.service.ts`: Core business logic; orchestrates repository operations, generates ISO timestamps via injectable `now()` clock, and throws typed domain errors.
- `src/routes/tickets.ts`: Express route handlers for `/api/tickets` endpoints (`GET /`, `POST /`, `GET /stats`, `GET /:id`, `PATCH /:id`).
- `src/routes/health.ts`: Health check route (`GET /api/health`).
- `src/middleware/validate.ts`: Centralized Zod validation middleware storing coerced data on `res.locals.validated` (protects read-only `req.query`).
- `src/middleware/not-found.ts`: Standardized 404 JSON response handler for unmatched routes.
- `src/middleware/error-handler.ts`: Global error handler catching domain and unexpected errors, outputting structured `{ error: { code, message, details } }`.
- `src/__tests__/`: 48 comprehensive API integration tests across 7 test suites running against isolated in-memory SQLite instances.

### `apps/web` (Vite + React 19 Frontend)
- `package.json`: Frontend dependencies (React 19, React Router v6, TanStack Query v5, Tailwind CSS v3, Heroicons).
- `vite.config.ts`: Vite build configuration with `/api` proxy pointing to Express backend on port 3001.
- `src/main.tsx`: React application entry point.
- `src/App.tsx`: App shell with `QueryClientProvider`, `ToastProvider`, and client-side routing.
- `src/index.css`: Tailwind directives, focus rings, base typography, and `prefers-reduced-motion` accessibility support.
- `src/api/client.ts`: Typed API client wrapping `fetch` with error response parsing into `ApiError`.
- `src/context/ToastContext.tsx`: Accessible toast notification provider using `role="status"` and `aria-live="polite"`.
- `src/hooks/useUrlState.ts`: URL query parameter state manager; acts as single source of truth for search, filters, sorting, and pagination.
- `src/hooks/useTickets.ts`: TanStack Query hook for fetching paginated tickets with `keepPreviousData`.
- `src/hooks/useTicket.ts`: TanStack Query hook for single ticket detail fetching.
- `src/hooks/useTicketStats.ts`: TanStack Query hook for global summary stats cards.
- `src/hooks/useDebounce.ts`: Generic 300ms debounce hook for search input.
- `src/components/layout/Header.tsx`: Responsive navigation header with logo and direct action links.
- `src/components/common/Badge.tsx`: Accessible status and priority badges using WCAG AA compliant colors and subtle dot indicators.
- `src/components/common/Toast.tsx`: Toast presentation component.
- `src/components/dashboard/StatsCards.tsx`: 4 summary metric cards (Total, Open, In Progress, Resolved).
- `src/components/dashboard/FilterBar.tsx`: Debounced search box, status dropdown, priority dropdown, sort toggle, and clear filters button.
- `src/components/dashboard/TicketTable.tsx`: Desktop table view (screen width >= 768px) with hover states and clickable rows.
- `src/components/dashboard/TicketCards.tsx`: Mobile stacked card view (screen width < 768px) optimized for touch targets.
- `src/components/dashboard/Pagination.tsx`: Accessible pagination controls with previous/next buttons and page count indicators.
- `src/pages/DashboardPage.tsx`: Main dashboard view coordinating stats, filters, table/cards, loading skeletons, and empty states.
- `src/pages/CreateTicketPage.tsx`: Ticket creation form with live `0/120` character counter, inline validation errors, and submit state.
- `src/pages/TicketDetailPage.tsx`: Detailed ticket view with back link preserving URL search state, inline status/priority triage dropdowns, and rollback on failure.
- `src/pages/NotFoundPage.tsx`: Accessible 404 error page.
- `src/__tests__/frontend.test.tsx`: 8 React Testing Library tests covering validation, pending state, skeletons, empty states, URL sync, and retries.

---

## 2. Request Lifecycles

### A. Create Ticket Lifecycle (`POST /api/tickets`)
1. **User Interaction**: User fills out title, description, customer email, and priority on `/tickets/new` and clicks "Create Ticket".
2. **Client Validation**: Zod schema (`CreateTicketSchema`) validates inputs before network dispatch; errors render immediately under respective inputs.
3. **API Dispatch**: `apiClient.createTicket(payload)` dispatches `POST /api/tickets` with JSON payload.
4. **Express Middleware**:
   - `express.json()` parses body (capped at 100kb).
   - `validateBody(CreateTicketSchema)` strips unknown fields and validates constraints (e.g. title <= 120 chars, valid email).
   - Coerced, validated data is stored on `res.locals.validated.body`.
5. **Route Handler**: `createTicketsRouter` extracts `res.locals.validated.body` and calls `ticketService.createTicket(data)`.
6. **Service Layer**:
   - `TicketService.createTicket` uses injectable clock `now()` to generate synchronized `createdAt` and `updatedAt` ISO strings.
   - Normalizes customer email (`toLowerCase().trim()`).
   - Sets initial status to `'Open'`.
   - Calls `ticketRepository.create(...)`.
7. **Repository Layer**:
   - `TicketRepository.create` executes parameterized SQL:
     ```sql
     INSERT INTO tickets (title, description, customer_email, status, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);
     ```
   - Fetches newly inserted record by `lastInsertRowid` and maps snake_case columns to camelCase DTO.
8. **Response**: Express responds with HTTP 201 Created and JSON ticket data.
9. **UI Update**:
   - TanStack Query invalidates `ticketKeys.all` and `ticketKeys.stats()`.
   - Toast notification appears: *"Ticket #37 created successfully"*.
   - React Router redirects immediately to `/tickets/37`.

---

### B. List Tickets Lifecycle (`GET /api/tickets`)
1. **URL State Synchronization**: User types "billing" into search box; after 300ms debounce, `useUrlState` updates URL to `/?search=billing&page=1`.
2. **Hook Execution**: `useTickets({ search: 'billing', page: 1, pageSize: 10, ... })` fires query.
3. **API Dispatch**: `apiClient.getTickets(params)` sends `GET /api/tickets?search=billing&page=1&pageSize=10`.
4. **Validation Middleware**:
   - `validateQuery(ListQuerySchema)` checks query parameters.
   - Trims whitespace-only strings to `undefined`.
   - Rejects search queries exceeding 100 characters with HTTP 400.
   - Rejects repeated array query parameters (`?status=Open&status=Closed`) with HTTP 400.
   - Saves parsed query into `res.locals.validated.query`.
5. **Service Layer**:
   - `TicketService.listTickets` calculates pagination offset `(page - 1) * pageSize`.
   - Invokes `ticketRepository.findAll` and `ticketRepository.countAll`.
6. **Repository Layer**:
   - Sanitizes search string by escaping `%`, `_`, and `\` with `\`.
   - Builds parameterized SQL:
     ```sql
     SELECT * FROM tickets
     WHERE (title LIKE ? ESCAPE '\' OR customer_email LIKE ? ESCAPE '\')
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?;
     ```
   - Deterministic tie-breaker (`id DESC`) guarantees stable ordering even when items share identical timestamps.
7. **Response**:
   ```json
   {
     "data": [...],
     "pagination": { "page": 1, "pageSize": 10, "total": 4, "totalPages": 1 }
   }
   ```
8. **UI Render**:
   - Desktop view renders responsive `TicketTable` with highlightable rows.
   - Mobile view renders responsive stacked `TicketCards`.
   - If total is 0 and filters are active, `NoMatchState` renders with a "Clear filters" button.

---

## 3. Five Likely Live-Change Interview Tasks

### Task 1: Add a New Status (`'Waiting on Customer'`)
- **Estimated Time**: 5 minutes
- **Files to Edit**:
  1. `packages/shared/src/schemas/ticket.ts`: Add `'Waiting on Customer'` to `TicketStatusSchema = z.enum([...])`.
  2. `apps/api/migrations/001_create_tickets.sql` (or new migration `002_add_status.sql`): Update CHECK constraint `status IN (...)`.
  3. `apps/web/src/components/common/Badge.tsx`: Add badge color variant for `'Waiting on Customer'` (e.g., purple/indigo styling).
  4. `apps/web/src/components/dashboard/FilterBar.tsx`: Add option to status dropdown filter.
  5. `apps/web/src/pages/TicketDetailPage.tsx`: Add option to status triage select element.

---

### Task 2: Add a New Filter (Filter by `customerEmail`)
- **Estimated Time**: 4 minutes
- **Files to Edit**:
  1. `packages/shared/src/schemas/ticket.ts`: Add `customerEmail: z.string().optional()` to `ListQuerySchema`.
  2. `apps/api/src/repository/ticket.repository.ts`: Add `if (query.customerEmail) { whereClauses.push('customer_email = ?'); params.push(query.customerEmail.toLowerCase().trim()); }` to `buildWhereClause`.
  3. `apps/web/src/components/dashboard/FilterBar.tsx`: Add email filter input and wire to `useUrlState`.

---

### Task 3: Add a New Field (`category` on Tickets)
- **Estimated Time**: 7 minutes
- **Files to Edit**:
  1. `packages/shared/src/schemas/ticket.ts`:
     - Add `TicketCategorySchema = z.enum(['Billing', 'Technical', 'General'])`.
     - Add `category` to `TicketSchema`, `CreateTicketSchema`, and `UpdateTicketSchema`.
  2. `apps/api/migrations/002_add_category.sql`: `ALTER TABLE tickets ADD COLUMN category TEXT NOT NULL DEFAULT 'General';`.
  3. `apps/api/src/repository/ticket.repository.ts`: Update `mapRowToTicket`, `create`, and `update` queries to read/write `category`.
  4. `apps/web/src/pages/CreateTicketPage.tsx`: Add category dropdown field to form.
  5. `apps/web/src/components/dashboard/TicketTable.tsx`: Add Category column to table.

---

### Task 4: Change Default Page Size (From 10 to 20)
- **Estimated Time**: 2 minutes
- **Files to Edit**:
  1. `packages/shared/src/schemas/ticket.ts`: In `querySchema`, change `pageSize` or repository `PAGE_SIZE` to 20.
  2. `apps/web/src/hooks/useUrlState.ts`: Update default `pageSize` fallback from 10 to 20.

---

### Task 5: Add Sort by Priority (`priority_desc` / `priority_asc`)
- **Estimated Time**: 6 minutes
- **Files to Edit**:
  1. `packages/shared/src/schemas/ticket.ts`:
     - Update `sort` in `querySchema` to accept `'newest' | 'oldest' | 'priority_desc' | 'priority_asc'`.
  2. `apps/api/src/repository/ticket.repository.ts`:
     - In `findAll()`, map `'priority_desc'` to `CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 END DESC, created_at DESC, id DESC`.
     - Map `'priority_asc'` to `CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 END ASC, created_at DESC, id DESC`.
  3. `apps/web/src/components/dashboard/FilterBar.tsx`: Add Priority Sort options to the Sort dropdown.
