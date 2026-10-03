# Requirements Traceability Matrix

Extracted from [00-assignment.md](file:///u:/support-ticket-dashboard/docs/00-assignment.md). Every sentence-level requirement plus implicit requirements derived from evaluation criteria, spec locks, and submission checklist.

---

## Explicit Requirements

| ID | Requirement Text | Doc Section | Planned Code Location | Planned Test |
|----|-----------------|-------------|----------------------|--------------|
| R-01 | Each ticket should contain: Title — required, maximum 120 characters | §1 Create | `packages/shared/src/schemas/ticket.ts` (zod), `apps/api/src/routes/tickets.ts` | `test:api` — validation: V1 (empty), V2 (whitespace), V3 (120-char), V4 (121-char) |
| R-02 | Each ticket should contain: Description — required | §1 Create | `packages/shared/src/schemas/ticket.ts` | `test:api` — validation: V5 (empty), V6 (whitespace) |
| R-03 | Each ticket should contain: Customer email — required, valid email format | §1 Create | `packages/shared/src/schemas/ticket.ts` | `test:api` — validation: V7 (invalid email), V8 (lowercase on create) |
| R-04 | Each ticket should contain: Priority — Low, Medium, or High | §1 Create | `packages/shared/src/schemas/ticket.ts` | `test:api` — validation: V10 (bad enum value) |
| R-05 | Each ticket should contain: Status — Open, In Progress, or Resolved; defaults to Open | §1 Create | `packages/shared/src/schemas/ticket.ts`, DB default | `test:api` — validation: V9 (bad enum), V11 (defaults to Open) |
| R-06 | Created and updated timestamps generated automatically | §1 Create | `apps/api/src/service/ticket.service.ts` (injectable clock), DB defaults | `test:api` — C1 (valid ISO strings), U3 (updatedAt advances), U4 (createdAt immutable) |
| R-07 | Validate inputs on both the frontend and backend, and display useful error messages | §1 Create | shared zod schemas, frontend form validation, API validation middleware | `test:api` — validation tests V1..V11; `test:web` — F1 (form errors) |
| R-08 | Build a ticket listing page that supports searching by title or customer email | §2 View/Find | `apps/api/src/repository/ticket.repository.ts` (LIKE query), `apps/web/src/pages/Dashboard.tsx` | `test:api` — L2 (title search), L3 (email search), L7 (wildcard escaping) |
| R-09 | Filtering by status and priority | §2 View/Find | Repository WHERE clauses, frontend filter controls | `test:api` — L12 (status filter), L13 (priority filter), L4 (status+search) |
| R-10 | Sorting by creation date, newest or oldest first | §2 View/Find | Repository ORDER BY, frontend sort toggle | `test:api` — L5 (newest), L6 (oldest), L8 (stable tie-breaker) |
| R-11 | Pagination with 10 tickets per page | §2 View/Find | Repository LIMIT/OFFSET, API pagination meta | `test:api` — L1 (pagination meta), L9 (out-of-range), L10 (page 0), L11 (page abc) |
| R-12 | Search and filters should work together | §2 View/Find | Repository query builder combines WHERE clauses | `test:api` — L4, L14 (search+status+priority+sort+page) |
| R-13 | Filtering, sorting, and pagination must be handled by the backend | §2 View/Find | All query logic in repository layer, not frontend | Architecture design & integration tests L1..L16 |
| R-14 | Users should be able to open a ticket, view its complete details | §3 View/Update | `apps/web/src/pages/TicketDetail.tsx`, `GET /api/tickets/:id` | `test:api` — GET by id returns all fields |
| R-15 | Update its status and priority. Changes must persist after refreshing the page | §3 View/Update | `PATCH /api/tickets/:id`, detail page edit controls | `test:api` — U1 (status), U2 (priority), U3 (clock advance), U4 (created_at immutable) |
| R-16 | Display total number of tickets and counts for Open, In Progress, and Resolved | §4 Stats | `GET /api/tickets/stats`, `apps/web/src/components/StatsCards.tsx` | `test:api` — S0 (empty DB zeros), S1 (accurate counts), S3 (count updates) |
| R-17 | Counts should reflect the entire dataset, regardless of active filters | §4 Stats | Stats endpoint has no filter params, always counts all rows | `test:api` — S2 (stats unchanged by query parameters) |
| R-18 | Use a frontend framework, backend framework, and database | §Tech | Vite+React 19, Express 5, SQLite (better-sqlite3) | Architecture verification |
| R-19 | Build a responsive interface suitable for desktop and mobile | §Tech | Tailwind responsive utilities, table (≥768px) and card (<768px) | Browser verification at 375px and 1280px |
| R-20 | Include loading, empty, and error states | §Tech | Skeletons, empty states ("no tickets" vs "no matches"), error boundaries | `test:web` — F3 (loading), F4 (empty), F7 (no-match), F8 (error) |
| R-21 | Use meaningful HTTP status codes and consistent API error responses | §Tech | Error middleware, standard `{error:{code,message,details}}` | `test:api` — 201/200/400/404/500 codes, E1..E3 |
| R-22 | Organize the code so another developer can understand and extend it | §Tech | Monorepo, layered architecture, `docs/09-EXTENDING.md` | Code review & walkthrough |
| R-23 | Include at least three meaningful automated tests covering validation, querying, or ticket updates | §Tech | `apps/api/src/__tests__/`, `apps/web/src/__tests__/` | 56 automated tests planned (48 API, 8 frontend) |
| R-24 | Provide seed data containing at least 25 tickets with varied statuses and priorities | §Tech | `apps/api/src/db/seed.ts` (36 benchmark tickets) | `test:api` — D1 (36 rows), D2 (idempotent seed) |
| R-25 | Application source code in Git repository | §Submission | Root of repository | Git commits |
| R-26 | Database setup or migrations and seed instructions | §Submission | `apps/api/migrations/*.sql`, README | `test:api` — D3 (idempotent migrations) |
| R-27 | README with setup steps, required environment variables, and instructions to run tests | §Submission | `README.md` | Verification checklist |
| R-28 | Brief explanation of technical choices, assumptions, known limitations, and time spent | §Submission | `README.md` §Technical Choices, §Time Spent | Verification checklist |
| R-29 | Screenshots or a short demonstration video | §Submission | `docs/screenshots/`, README embeds | Visual review |
| R-30 | Application should run locally using the documented instructions | §Submission | `npm run setup && npm run dev` | Clean checkout smoke test |
| R-31 | Spend no more than 6 hours | §Time | `docs/06-PHASES.md` time budget | Time log table in `docs/08` |
| R-32 | AI tools are permitted. Briefly describe how you used them | §Time | `README.md` §AI Usage | Transparency documentation |
| R-33 | Be prepared to explain and modify all submitted code (interview) | §Time | `docs/09-EXTENDING.md` | Live change readiness |
| R-34 | List query parameter sanitization & validation (empty strings absent, whitespace search absent, max 100 chars, repeated params rejected) | §2 View/Find | `packages/shared/src/schemas/ticket.ts` | `test:api` — L10, L11, L15 (empty strings), L16 (whitespace) |
| R-35 | Pagination calculation: totalPages = ceil(total/10), 0 when total is 0 ("Page 1 of 1" in UI); out-of-range returns 200 with data [] | §2 View/Find | `apps/api/src/repository/ticket.repository.ts`, `Pagination.tsx` | `test:api` — L1, L9 |
| R-36 | POST strips unknown fields; PATCH is strict (unknown fields / empty body -> 400); unchanged PATCH values return 200 and bump updatedAt | §1 Create, §3 Update | `apps/api/src/routes/tickets.ts`, validation middleware | `test:api` — C1, C2, U3, U4, U5, U6, U8, U9 |
| R-37 | Post-creation navigates to `/tickets/:id`; detail page back link preserves previous list URL query string | §1 Create, §3 Update | `apps/web/src/pages/CreateTicket.tsx`, `TicketDetail.tsx` | `test:web` — F1, F6 |

---

## Implicit Requirements

| ID | Requirement Text | Source | Planned Code Location | Planned Test |
|----|-----------------|--------|----------------------|--------------|
| R-I01 | Responsive: desktop and mobile, no horizontal scroll at 375px | Eval: Usability 15% | Tailwind responsive classes, mobile-first | Browser inspection at 375px and 1280px |
| R-I02 | Loading states: skeleton/spinner during data fetch | Eval: Usability 15% | React Query `isLoading`, skeleton components | `test:web` — F3 (loading skeleton) |
| R-I03 | Empty states: "no tickets yet" with CTA vs "no matches" with clear-filters | Eval: Usability 15% | Conditional rendering in TicketList / Dashboard | `test:web` — F4 (no tickets), F7 (no matches) |
| R-I04 | Error states: error message with retry button | Eval: Usability 15% | React Query `isError`, error component | `test:web` — F8 (error with retry) |
| R-I05 | Meaningful HTTP codes: 201 create, 200 success, 400 validation, 404 not found, 500 internal | Eval: API 20% | Express error middleware | `test:api` — all status codes across test suites |
| R-I06 | Consistent error response shape: `{error:{code,message,details?}}` | Eval: API 20% | Error middleware, zod validation handler | `test:api` — error shape assertions (E1, E2, E3) |
| R-I07 | Seed data: ≥25 tickets (we do 36), varied status/priority | Eval: Functional 30% | `apps/api/src/db/seed.ts` | `test:api` — D1, D2 |
| R-I08 | README contents: setup, env vars, run tests, technical choices, assumptions, known limitations, time spent | Eval: Tests+Docs 10% | `README.md` | Verification checklist |
| R-I09 | Code organized for extension (another developer can understand and extend) | Eval: Structure 25% | Layered architecture, shared schemas | `docs/09-EXTENDING.md` |
| R-I10 | Interview readiness: "small change" to the application | Eval criteria | `docs/09-EXTENDING.md` walkthrough | Interview prep |
| R-I11 | Malformed JSON body → 400 with consistent error shape | Best practice | Express JSON parse error handler | `test:api` — E1 (malformed JSON) |
| R-I12 | Unknown routes → 404 with consistent error shape | Best practice | Catch-all 404 handler | `test:api` — E2 (unknown route) |
| R-I13 | Never leak stack traces in production | Best practice | Error middleware strips stack in non-dev | Architecture design |
| R-I14 | SPA fallback must not swallow /api 404s | Best practice | Middleware registered after API routes; skips `/api` | Architecture design & deployment verification |
