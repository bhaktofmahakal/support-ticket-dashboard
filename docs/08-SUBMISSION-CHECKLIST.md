# Submission Checklist

Check each item before submitting. Every unchecked item must be explained in "Known Limitations."

## Code

- [x] `npm run setup` (migrate + seed) runs without errors
- [x] `npm run dev` starts API + web concurrently
- [x] `npm run build` produces production bundle without errors
- [x] `npm start` serves the full app (migrate → seed if empty → serve)
- [x] `npm run test` — all tests pass (56 passed: 48 API + 8 Web)
- [x] `npm run typecheck` — no TypeScript errors
- [x] `npm run lint` — no lint errors
- [x] No `console.log` in production code (only in dev/debug)
- [x] No hardcoded localhost URLs (use relative `/api` paths)
- [x] `.gitignore` excludes `node_modules/`, `dist/`, `data/`, `.env`

## Functional Correctness (30%)

- [x] Create ticket: all validations work (title 120, email, enums, whitespace)
- [x] List tickets: search + filter + sort + pagination all work together
- [x] View ticket: all fields displayed
- [x] Update ticket: status and priority persist after refresh
- [x] Stats: reflect entire dataset, not filtered subset
- [x] Stats refresh after create/update
- [x] Seed data: 36 tickets with varied status/priority

## API Quality (20%)

- [x] POST → 201, GET → 200, PATCH → 200
- [x] Validation errors → 400 with `{error:{code,message,details}}`
- [x] Not found → 404 with `{error:{code,message}}`
- [x] Internal errors → 500 with generic message (no stack trace)
- [x] Malformed JSON → 400
- [x] Unknown route → 404
- [x] PATCH rejects unknown fields
- [x] PATCH rejects empty body
- [x] GET /api/tickets/stats registered before /:id

## Code Structure (25%)

- [x] Monorepo: apps/api, apps/web, packages/shared
- [x] Layered API: routes → service → repository
- [x] Shared zod schemas used on both frontend and backend
- [x] No business logic in route handlers
- [x] No SQL in service layer
- [x] Each file has a single responsibility

## Usability (15%)

- [x] Responsive: table on desktop, cards on mobile
- [x] No horizontal scroll at 375px
- [x] Loading skeletons during fetch
- [x] Empty state: "no tickets yet" with create CTA
- [x] Empty state: "no matches" with clear-filters
- [x] Error state with retry button
- [x] 404 state for unknown ticket ID
- [x] Debounced search (300ms)
- [x] Filter/search changes reset page to 1
- [x] URL state: filters/search/sort/page survive refresh
- [x] Accessible: labels, focus rings, aria-live, semantic HTML

## Design System Conformance

- [ ] All UI follows `DESIGN.md` and `docs/12-DESIGN-ADAPTATION.md`
- [ ] Deep dark canvas (`#010102`) and four-step surface ladder implemented
- [ ] No hardcoded hex colors, font sizes, or radii in components; all use Tailwind tokens backed by CSS variables
- [ ] Self-hosted typography: `@fontsource/inter` and `@fontsource/jetbrains-mono` bundled locally (no Google Fonts / CDN)
- [ ] Status and Priority badges pair distinct hue with text label and geometric icon (color is never the only signal)
- [ ] WCAG 2.1 AA contrast verified across all foreground/surface pairs (text ≥ 4.5:1, UI components ≥ 3.0:1)
- [ ] Character counter reflects visual warning (110) and danger (120) states
- [ ] Single dark theme adhered to with zero theme-switching ambiguity
- [ ] Preserves all existing functionality, props, hooks, API contracts, URL param names, routes, form field names/ids/labels, and ARIA attributes

## Tests (10%)

- [x] All 56 tests in docs/07 implemented and green (48 API tests, 8 frontend tests)
- [x] Phase 3 gate: every API test listed in docs/07 is green (all 48 API tests pass)
- [x] Phase 6 gate: every frontend test listed in docs/07 is green (all 8 frontend tests pass)
- [x] ≥3 meaningful automated tests (assignment minimum)
- [x] Isolated: each test uses fresh in-memory DB
- [x] Covers creation, validation, querying, updates, stats, error shapes, seed/migrations
- [x] Frontend tests: form errors, pending states, list states, URL filter sync, empty/no-match, retry

## README

- [x] Setup steps (prerequisites, install, run)
- [x] Required environment variables (NODE_VERSION, PORT, DATABASE_PATH)
- [x] How to run tests
- [x] Technical choices with rationale
- [x] Assumptions
- [x] Known limitations
- [x] Time spent (honest log)
- [x] AI usage description
- [x] Screenshots or demo video

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
| Phase 4: Frontend Foundation & List | 65m |
| Phase 5: Create Form, Detail & Update | 50m |
| Phase 6: Polish, Accessibility & Frontend Tests | 40m |
| Phase 7: Production Build, README & Deploy | 25m |
| **Total Logged** | **5h 50m** |

## AI Usage

[Detailed in root README.md]

## Screenshots

[Screenshots stored in docs/screenshots/ and linked in root README.md]
```

## Render Deployment

- [x] `render.yaml` present and valid
- [x] Health check path: `/api/health`
- [x] Ephemeral SQLite caveat documented in README and docs/11
