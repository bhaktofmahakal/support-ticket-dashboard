

## AUTOPILOT: runs the whole build (use this after docs are reviewed)

```
Read AGENTS.md and ALL files in docs/ first. You will now build the entire product phase by phase, following docs/06-PHASES.md exactly (7 phases). Work autonomously. Do not ask me questions unless a docs conflict blocks you.

For EACH phase, in order:
1. Re-read the relevant docs sections for that phase.
2. Implement only that phase's scope.
3. Run the real commands (install, typecheck, lint, test, build, run server) and read the real output. Fix failures before moving on.
4. For any UI work, use the browser MCP to load the running app and actually click through it at 375px, 768px and 1280px. Fix what looks broken. Do not claim a UI works without having looked at it.
5. Check the phase exit gate from docs/06-PHASES.md. If any item fails, fix and re-check. Do not proceed with a failing gate.
6. Append an honest time estimate to the time log in docs/08.
7. Make exactly one commit with a conventional message (feat/test/docs/chore) for the phase.
8. Print a short phase report: done, test counts and results, deviations from docs (should be none), exit-gate PASS/FAIL list.

Hard rules:
- Locked decisions in the docs are law. If you believe one is wrong, stop and tell me why instead of changing it.
- Code must be simple and explainable: small functions, clear names, comments only for non-obvious decisions, no clever abstractions. I must be able to explain every line in an interview.
- No placeholder UI, no TODOs left in code, no console errors in browser, no unhandled promise rejections.
- Never commit node_modules, .env, or the sqlite db file. Commit .env.example.
- Keep the app ONE command to run: npm install, npm run setup, npm run dev.

After phase 7, run the P4 final audit steps yourself (fresh-clone simulation + line-by-line verification against docs/00-assignment.md with evidence), fix every FAIL, and print the final PASS/FAIL table. Then stop and wait.
```

---

## P3: Individual phase prompts (use these instead of AUTOPILOT if you want a review gate between phases)

Common header for every phase prompt below (already included in each; do not add anything):

### P3-1: Scaffold + database + seed

```
Read AGENTS.md and docs/ (02, 03, 05, 06, 07, 11). Execute ONLY Phase 1. Do not start Phase 2.

Phase 1 scope:
- npm workspaces monorepo: apps/api, apps/web (empty Vite React TS app with Tailwind configured and a placeholder page), packages/shared.
- Root tooling: TypeScript strict everywhere, ESLint, Prettier, .editorconfig, .gitignore, .nvmrc, .env.example (PORT, DATABASE_PATH, VITE_API_URL if needed), root scripts per docs (setup, dev, build, start, test, typecheck, lint).
- packages/shared: zod schemas and TS types for Ticket, CreateTicketInput, UpdateTicketInput, ListQuery (search, status, priority, sort, page), Pagination, ErrorResponse, enums for status and priority.
- apps/api: config loader, better-sqlite3 connection factory (path from env, supports ":memory:"), tiny migration runner reading versioned .sql files from apps/api/migrations (tracks applied versions in a schema_migrations table), migration 001 creating tickets table with CHECK constraints and indexes, seed script (36 tickets as specified in docs/05, idempotent: only inserts if table empty, plus a --reset flag), ticket repository with functions: create, findById, list(query), updateStatusPriority, stats. All SQL parameterized; LIKE with ESCAPE and wildcard escaping; ORDER BY created_at <dir>, id <dir>.
- No HTTP routes yet beyond nothing; this phase is data layer only.

Rules: follow locked decisions exactly; conflicts with docs -> stop and tell me. Run real commands and show real output. Simple, explainable code. Update time log in docs/08. One conventional commit at the end.

Exit gate (verify with real commands): npm install succeeds on a clean checkout; npm run typecheck and lint pass; npm run setup creates the DB with 36 rows; running setup again keeps 36 (idempotent); a quick script or test proves repository.list handles search + filters + sort + pagination and repository.stats returns correct counts. Report PASS/FAIL per item.
```

### P3-2: API

```
Read AGENTS.md and docs/ (02, 03, 04, 05, 06, 07). Execute ONLY Phase 2. Do not start Phase 3.

Phase 2 scope (apps/api):
- Express app factory createApp(deps) so tests can inject an in-memory DB; separate server entry that listens.
- Layers: routes (HTTP only) -> service (business rules) -> repository (SQL). No SQL in routes, no HTTP in services.
- Endpoints exactly per docs/04: POST /api/tickets, GET /api/tickets, GET /api/tickets/stats (registered before /:id), GET /api/tickets/:id, PATCH /api/tickets/:id, GET /api/health.
- Validation middleware using the shared zod schemas for body AND query AND params. PATCH is strict (unknown fields -> 400, empty body -> 400). Trim title/description, lowercase email.
- Central error handler producing {error:{code,message,details?}}; VALIDATION_ERROR 400, NOT_FOUND 404, INTERNAL_ERROR 500; unknown /api route -> 404 same shape; malformed JSON -> 400 same shape; never leak stack traces (log them server-side).
- Security basics: helmet, request body size limit, JSON only; CORS enabled for dev origin only.
- Pagination response meta {page,pageSize:10,total,totalPages}; out-of-range page returns empty data with correct totals; page<1 or non-integer -> 400.
- Request logging (morgan or pino-http), quiet in tests.

Rules: follow locked decisions exactly; conflicts -> stop and tell me. Run the server and exercise EVERY endpoint with curl, including invalid inputs, and show real responses. Simple, explainable code. Update time log. One conventional commit.

Exit gate: each endpoint returns the documented shape and status code (show curl output for: create ok, create invalid, list with search+status+priority+sort+page combined, stats while a filter is active in a parallel request, get 200, get 404, get malformed id, patch ok, patch unknown field, patch empty body, malformed JSON, unknown route). typecheck and lint pass. Report PASS/FAIL per item.
```

### P3-3: Backend tests

```
Read AGENTS.md and docs/ (04, 05, 07). Execute ONLY Phase 3. Do not start Phase 4.

Phase 3 scope (apps/api tests with Vitest + Supertest, each test gets a fresh in-memory DB, migrations applied, deterministic fixtures):
Implement every case in docs/07-TEST-PLAN.md, at minimum 18 tests covering:
- Validation: missing/empty title, whitespace-only title, title length 120 ok and 121 rejected, missing description, invalid email variants, email lowercased on save, invalid priority/status, default status Open, error shape and details[].field present.
- List/query: search matches title, search matches email, search is case-insensitive, search escapes % and _ (a literal % query does not match everything), status filter, priority filter, search+status+priority together, sort newest vs oldest, stable order with duplicate timestamps across page boundaries (no duplicates, no gaps across pages), page size 10 with correct totalPages, out-of-range page empty with correct total, invalid page -> 400.
- PATCH: persists across a fresh GET, updated_at changes while created_at stays, rejects unknown fields, rejects empty body, rejects invalid enum, 404 for missing id.
- Stats: counts reflect whole dataset and are unchanged by list filters, update after create and after PATCH.
- Errors: 404 unknown route shape, malformed JSON shape, no stack in responses.
Also run a mutation sanity check: temporarily break one thing (e.g. remove the id tie-breaker or the LIKE escape) and confirm a test fails, then restore it. Report which tests caught which mutation.

Rules: tests must assert behavior, not implementation details. Show real test output with counts. Update time log. One conventional commit.

Exit gate: all tests green, count >= 18, mutation checks caught, coverage report printed (informational). Report PASS/FAIL per item.
```

### P3-4: Frontend foundation, dashboard and list

```
Read AGENTS.md and docs/ (02, 03, 04, 06). Execute ONLY Phase 4. Do not start Phase 5.

Phase 4 scope (apps/web):
- App shell: header with product name, "New ticket" button, responsive container, react-router routes (/, /tickets/new, /tickets/:id, and a NotFound route). Consistent design tokens in Tailwind (spacing, radius, colors, status/priority badges with text+color, never color alone).
- API client (typed with shared types): single fetch wrapper that parses the standard error shape into a typed ApiError carrying details[].
- TanStack Query setup: query keys factory, hooks useTickets(params), useStats(), keepPreviousData on list, sensible staleTime, retry limited.
- Dashboard page: summary cards (Total, Open, In Progress, Resolved) from /api/tickets/stats, with skeleton and error states, independent of list filters.
- Ticket list: search input (debounced 300ms), status filter, priority filter, sort select (Newest/Oldest), pagination controls (Prev/Next + "Page X of Y" + total count), ALL synced to URL query params (read on load, write on change, page resets to 1 when search/filter/sort changes, invalid URL params fall back to defaults). Clear filters button. Desktop = semantic table, mobile = stacked cards; each row links to /tickets/:id.
- States: skeleton loading for list, distinct empty states ("No tickets yet" with New ticket CTA vs "No matching tickets" with Clear filters), error state with Retry button, subtle fetching indicator while keepPreviousData is showing old data.

Rules: follow locked decisions exactly. Use the browser MCP: with the API running, load the app and actually test: type in search (watch the URL change and results update), combine filters, paginate to the last page, refresh the page and confirm state persists, resize to 375/768/1280, kill the API and confirm the error state + retry works, apply filters that match nothing and confirm the no-match state. Fix what is broken. Simple, explainable components. Update time log. One conventional commit.

Exit gate: every behavior above verified in the real browser (describe what you observed for each), typecheck and lint pass, no console errors. Report PASS/FAIL per item.
```

### P3-5: Create, detail, update

```
Read AGENTS.md and docs/ (02, 03, 04, 06). Execute ONLY Phase 5. Do not start Phase 6.

Phase 5 scope (apps/web):
- Create ticket page (/tickets/new): fields title (with live character counter x/120), description (textarea), customer email, priority select (default Medium), status is not shown (defaults to Open server-side) unless docs/02 says otherwise. Client-side validation with the shared zod schema, errors shown inline per field on blur/submit with aria-describedby, submit button disabled + spinner while pending, server field errors (400 details) mapped onto the right fields, generic server/network error shown in an alert region, on success toast + navigate to the new ticket (or back to list) and invalidate stats + tickets queries.
- Ticket detail page (/tickets/:id): shows title, description (preserve line breaks), customer email, priority, status, created and updated timestamps (human readable with full ISO in title attribute), back link that preserves the previous list URL state. Status and priority editable via selects; on change call PATCH, show saving state, success toast, error toast with revert on failure; updated timestamp refreshes; stats and list caches invalidated so counts are correct everywhere. Loading skeleton, 404 state for unknown/non-numeric id, error state with retry.
- Toast system (accessible, aria-live polite, auto-dismiss, dismissible).

Rules: follow locked decisions exactly. Use the browser MCP to test for real: submit empty form (all errors), 121-char title, bad email, whitespace-only title, valid create (verify it appears at top of Newest list and stats incremented), open detail, change status then hard refresh (must persist), change priority, go back and verify list+stats reflect it, open /tickets/99999 and /tickets/abc, simulate API down during PATCH and confirm revert + error toast, test at 375px and 1280px. Fix what is broken. Update time log. One conventional commit.

Exit gate: every behavior above verified in the real browser with what you observed; typecheck and lint pass; no console errors. Report PASS/FAIL per item.
```

### P3-6: Polish, responsive, accessibility, frontend tests, screenshots

```
Read AGENTS.md and docs/ (02, 06, 07, 08). Execute ONLY Phase 6. Do not start Phase 7.

Phase 6 scope:
- Responsive pass at 360, 375, 768, 1024, 1280: no horizontal page scroll, tap targets >= 40px on mobile, filters collapse or stack cleanly, pagination usable on mobile.
- Accessibility pass: every input has a label, visible focus rings, keyboard-only walkthrough of create/list/detail works, aria-live regions for toasts and errors, table has proper semantics, headings in order, sufficient color contrast for badges and text, prefers-reduced-motion respected. Run an automated a11y check with the browser MCP (axe if available) and fix violations.
- UX polish that stays in scope: consistent spacing and typography, focus management after navigation, document.title per route, favicon, meaningful button/loading labels. No new features.
- Frontend tests (Vitest + React Testing Library, mock the API layer): create form shows per-field errors for invalid input, list renders loading/empty/no-match/error states, filters write to the URL and reset page to 1. At least 4 tests.
- Screenshots saved to docs/screenshots/ using the browser MCP: dashboard desktop, dashboard mobile (375), list with filters applied, empty/no-match state, loading state, error state, create form with validation errors, create form mobile, ticket detail desktop and mobile. Add a small script or doc note on how they were generated.
- Optionally (only if time log shows buffer): record a short GIF/video of the main flow (create -> find via search -> update status -> refresh).

Rules: follow locked decisions exactly; no scope creep. Update time log. One conventional commit.

Exit gate: all frontend and backend tests green (show counts), a11y check clean or remaining issues listed, screenshots exist for every listed state, no console errors. Report PASS/FAIL per item.
```

### P3-7: Production build, README, deploy config

```
Read AGENTS.md and docs/ (03, 08, 11). Execute ONLY Phase 7.

Phase 7 scope:
- Production mode: Express serves apps/web/dist statically with SPA fallback (any non-/api GET returns index.html, but unknown /api routes still return the JSON 404 shape). npm run build builds shared, api, and web. npm start runs migrations, seeds only if the table is empty, then serves everything on PORT. Verify with a real run: npm run build && npm start, then open the app in the browser MCP, create a ticket, refresh a deep link like /tickets/3, confirm it works.
- render.yaml per docs/11 (native Node build, health check /api/health, env vars, NODE_VERSION). Add a short deployment section to docs/11 with exact click-by-click steps for deploying on Render from a GitHub repo, and the honest ephemeral-disk caveat plus upgrade paths.
- README.md (root), written for a reviewer who has 5 minutes: one-paragraph summary; screenshot strip; Quick start (exact commands: nvm use, npm install, npm run setup, npm run dev; URLs and ports); environment variables table; running tests (api, web, all) with expected counts; project structure; API reference table with example request/response and error shape; technical choices and tradeoffs (why SQLite, why shared zod schemas, why URL state, why TanStack Query, why plain SQL repository); assumptions (list every one); known limitations and what I would do next (auth, Postgres, optimistic updates, ticket comments, rate limiting, e2e in CI); how AI tools were used (be specific and honest: planning docs, scaffolding, test generation, browser verification; and that I reviewed and can explain all code); time spent (a table per phase from the docs/08 log, total must be <= 6h and honest); deployment section (live URL placeholder <<LIVE_URL>>, caveat).
- Final cleanup: remove dead code and unused deps, ensure .gitignore is right, run lint/typecheck/test/build one last time, ensure docs/ folder is tidy (keep it; it shows process) and docs/WALKTHROUGH.md exists: per-file 2-line purpose, request lifecycle for create and list, and 5 likely live-change tasks with exact files to edit (add a new status, add a new filter, add a field, change page size, add sort by priority).

Rules: simple and explainable. Update time log. One conventional commit.

Exit gate: fresh simulation: delete node_modules and the DB, follow ONLY the README top to bottom, everything works first try; production start works; README has every required section from docs/00-assignment.md Submission list. Report PASS/FAIL per item.
```

---

## P4: Final submission audit (run after all phases, or it is already inside AUTOPILOT)

```
Final audit. Act as an unforgiving reviewer. First simulate a fresh reviewer: delete node_modules, dist, and the DB file, then follow ONLY the README from scratch (install, env, setup, dev, test). Report every step that failed or was unclear and fix it.

Then verify against docs/00-assignment.md line by line WITH EVIDENCE (command output, curl output, or screenshot path), never assertions:
- every R-xx in docs/01 is PASS
- create ticket: all validations on frontend AND backend, useful error messages shown
- list: search by title and by email, status filter, priority filter, sort newest/oldest, 10 per page, all combined, all executed by the backend (show the SQL/route handling, no client-side filtering)
- detail view shows full details; status+priority update persists after hard refresh
- stats show whole-dataset counts regardless of filters (demonstrate with a filter active)
- loading, empty, and error states exist (screenshot paths)
- responsive at 375 and 1280 (screenshot paths)
- consistent API error responses and meaningful status codes (curl table)
- seed >= 25 tickets varied (print counts by status and priority)
- tests: report actual count, all green
- README contains every item the assignment's Submission section lists, time spent <= 6h and consistent with the log
- git history: one commit per phase, no secrets, no node_modules, no .db committed
- interview readiness: docs/WALKTHROUGH.md exists and its 5 live-change tasks are accurate; pick two of them and actually perform them on a scratch branch to prove they take under 10 minutes, then discard the branch

Print a PASS/FAIL table. Fix every FAIL and re-verify. End with: SUBMIT or NOT READY.
```

---

## P5: Deploy (Render, optional bonus)

Pehle repo GitHub par push karo (public ya Render ko access do). Phir ye prompt. Agar Render MCP/CLI available nahi hai to agent steps print karega, aur tum dashboard me click karoge.

```
Read docs/11-DEPLOYMENT.md and render.yaml. Goal: get this app live on Render as a single web service.

1. Verify locally one more time: npm ci && npm run build && npm start works with a fresh DB path, /api/health returns 200, deep link /tickets/3 loads, unknown /api/x returns the JSON 404 shape.
2. Check git status is clean and the latest commit is pushed to origin main. If no remote exists, tell me the exact commands to create the GitHub repo and push, then wait.
3. If a Render MCP or CLI is available, use it to create the service from render.yaml. If not, print exact click-by-click steps for the Render dashboard (New + > Web Service > connect repo > settings from render.yaml, or New + > Blueprint), then wait for me to paste the live URL.
4. Once I give the live URL (or you have it): use the browser MCP to test the live app: dashboard loads with seeded data, search+filter+pagination work, create a ticket, update status, hard refresh persists, deep link works, check the browser console for errors, test at 375px. Note cold-start delay on the free tier.
5. Update README: replace <<LIVE_URL>> with the real URL, add a note that the free-tier filesystem is ephemeral so data resets on redeploy (seed repopulates automatically) and that a cold start can take ~30-60s. Add live-app screenshots to docs/screenshots/. Commit as "docs: add live deployment".
6. Report PASS/FAIL for each live check.
```

---

## Notes for you (not for the agent)

- Seed data resets on Render free tier restart. Ye assignment ke liye theek hai kyunki seed auto-repopulate hota hai, aur README me caveat likha jayega. Agar persistent chahiye to Render disk (paid) ya Neon Postgres. Postgres swap ka kaam interview me bonus talking point bhi ban sakta hai.
- Deploy sirf bonus hai (assignment me explicitly out of scope). Pehle repo + README + screenshots complete karo, deploy last me.
- P2 ke baad `docs/` aur `docs/10-AUDIT.md` Claude chat me paste karo, review ke baad AUTOPILOT chalao.
- AUTOPILOT me agar agent beech me atak jaye ya galat direction le, to P3-1 se P3-7 ek-ek karke chalao.
- Build ke baad khud code padho: interview me live change hoga aur AI-usage explain karna padega.
