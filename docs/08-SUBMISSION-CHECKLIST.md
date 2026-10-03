# Submission Checklist

Check each item before submitting. Every unchecked item must be explained in "Known Limitations."

## Code

- [ ] `npm run setup` (migrate + seed) runs without errors
- [ ] `npm run dev` starts API + web concurrently
- [ ] `npm run build` produces production bundle without errors
- [ ] `npm start` serves the full app (migrate → seed if empty → serve)
- [ ] `npm run test` — all tests pass
- [ ] `npm run typecheck` — no TypeScript errors
- [ ] `npm run lint` — no lint errors
- [ ] No `console.log` in production code (only in dev/debug)
- [ ] No hardcoded localhost URLs (use relative `/api` paths)
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `data/`, `.env`

## Functional Correctness (30%)

- [ ] Create ticket: all validations work (title 120, email, enums, whitespace)
- [ ] List tickets: search + filter + sort + pagination all work together
- [ ] View ticket: all fields displayed
- [ ] Update ticket: status and priority persist after refresh
- [ ] Stats: reflect entire dataset, not filtered subset
- [ ] Stats refresh after create/update
- [ ] Seed data: 36 tickets with varied status/priority

## API Quality (20%)

- [ ] POST → 201, GET → 200, PATCH → 200
- [ ] Validation errors → 400 with `{error:{code,message,details}}`
- [ ] Not found → 404 with `{error:{code,message}}`
- [ ] Internal errors → 500 with generic message (no stack trace)
- [ ] Malformed JSON → 400
- [ ] Unknown route → 404
- [ ] PATCH rejects unknown fields
- [ ] PATCH rejects empty body
- [ ] GET /api/tickets/stats registered before /:id

## Code Structure (25%)

- [ ] Monorepo: apps/api, apps/web, packages/shared
- [ ] Layered API: routes → service → repository
- [ ] Shared zod schemas used on both frontend and backend
- [ ] No business logic in route handlers
- [ ] No SQL in service layer
- [ ] Each file has a single responsibility

## Usability (15%)

- [ ] Responsive: table on desktop, cards on mobile
- [ ] No horizontal scroll at 375px
- [ ] Loading skeletons during fetch
- [ ] Empty state: "no tickets yet" with create CTA
- [ ] Empty state: "no matches" with clear-filters
- [ ] Error state with retry button
- [ ] 404 state for unknown ticket ID
- [ ] Debounced search (300ms)
- [ ] Filter/search changes reset page to 1
- [ ] URL state: filters/search/sort/page survive refresh
- [ ] Accessible: labels, focus rings, aria-live, semantic HTML

## Tests (10%)

- [ ] All 56 tests in docs/07 implemented and green (48 API tests, 8 frontend tests)
- [ ] Phase 3 gate: every API test listed in docs/07 is green (all 48 API tests pass)
- [ ] Phase 6 gate: every frontend test listed in docs/07 is green (all 8 frontend tests pass)
- [ ] ≥3 meaningful automated tests (assignment minimum)
- [ ] Isolated: each test uses fresh in-memory DB
- [ ] Covers creation, validation, querying, updates, stats, error shapes, seed/migrations
- [ ] Frontend tests: form errors, pending states, list states, URL filter sync, empty/no-match, retry

## README

- [ ] Setup steps (prerequisites, install, run)
- [ ] Required environment variables (NODE_VERSION, PORT, DATABASE_PATH)
- [ ] How to run tests
- [ ] Technical choices with rationale
- [ ] Assumptions
- [ ] Known limitations
- [ ] Time spent (honest log)
- [ ] AI usage description
- [ ] Screenshots or demo video

### README Skeleton

```markdown
# Support Ticket Dashboard

> A full-stack support ticket management application.

## Quick Start

### Prerequisites
- Node.js ≥20 (see `.nvmrc`)
- npm ≥10

### Setup & Run
\```bash
git clone <repo-url>
cd support-ticket-dashboard
npm install
npm run setup    # Run migrations + seed data
npm run dev      # Start dev servers (API :3001, Web :5173)
\```

### Production Build
\```bash
npm run build
npm start        # Serves at http://localhost:3001
\```

### Run Tests
\```bash
npm test         # All tests
npm run test:api # API tests only
npm run test:web # Frontend tests only
\```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `DATABASE_PATH` | `./data/tickets.db` | SQLite database file path |
| `NODE_ENV` | `development` | Environment (development/production) |

## Technical Choices

[Fill in: why Vite+React, Express, SQLite, zod shared schemas, etc.]

## Assumptions

[Fill in from docs/02-PRD.md]

## Known Limitations

[Fill in any incomplete items]

## Time Spent

| Phase | Time |
|-------|------|
| Planning & Docs (Phases 0-2 / PRD / Specs / Audit) | 45m |
| Phase 1: Scaffold, Database & Seed | 40m |
| Phase 2: Express API & Middleware | 45m |
| Phase 3: Backend Test Suite | 40m |
| Phase 4: Frontend Foundation & List | Pending |
| Phase 5: Create Form, Detail & Update | Pending |
| Phase 6: Polish, Accessibility & Frontend Tests | Pending |
| Phase 7: Production Build, README & Deploy | Pending |
| **Total Logged** | **2h 50m** |

## AI Usage

[Brief description of how AI tools were used]

## Screenshots

[Embed 3-4 screenshots]
```

## Render Deployment

- [ ] `render.yaml` present and valid
- [ ] Health check path: `/api/health`
- [ ] Ephemeral SQLite caveat documented in README and docs/11
