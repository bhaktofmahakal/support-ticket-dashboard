# Product Requirements Document

## Goal

Build a production-quality support-ticket dashboard that demonstrates full-stack competence in a 4–6 hour window. The submission must be a **genuinely working, polished product** — not a minimum-viable skeleton — while remaining scope-disciplined.

## Non-Goals

- Authentication / authorization
- Multi-user / real-time collaboration
- Advanced visual design (clean, consistent Tailwind is enough)
- Deployment infrastructure beyond a single-service Render config

## User Stories

| # | As a… | I want to… | So that… | Acceptance Criteria | Req IDs |
|---|-------|-----------|---------|---------------------|---------|
| US-1 | Support agent | Create a new ticket with title, description, customer email, and priority | The request is tracked | Form validates all fields (shared zod), shows field-level errors, disables submit while pending, 201 from API, navigates to `/tickets/:id`, toast on success | R-01→R-07 |
| US-2 | Support agent | See a paginated list of all tickets | I can browse requests | Table (desktop) / cards (mobile), 10 per page, page controls, keepPreviousData, skeleton on load | R-11, R-19, R-I02 |
| US-3 | Support agent | Search tickets by title or email | I can find a specific request quickly | Debounced input (300ms), case-insensitive, matches partial, search + filters combine, resets page to 1 | R-08, R-12 |
| US-4 | Support agent | Filter by status and/or priority | I can focus on what matters | Dropdown/select filters, AND logic with search, resets page to 1, URL-persisted | R-09, R-12 |
| US-5 | Support agent | Sort by newest or oldest | I can prioritize | Toggle/select, default newest, URL-persisted | R-10 |
| US-6 | Support agent | See ticket counts (total, open, in-progress, resolved) | I have a quick overview | Stats cards above list, always reflect full dataset, refresh after create/update | R-16, R-17 |
| US-7 | Support agent | Open a ticket to view full details | I have context before acting | Detail page with all fields, back link preserves previous list URL query string, 404 state for unknown ticket | R-14, R-I04 |
| US-8 | Support agent | Update a ticket's status and priority | I can progress the workflow | Inline edit controls, immediate PATCH, success/error feedback, updated_at changes, created_at does not | R-15 |
| US-9 | Support agent | See distinct empty states | I'm never confused by a blank screen | "No tickets yet" + create CTA vs "No matches" + clear-filters | R-I03 |
| US-10 | Support agent | Share a filtered view via URL | My teammate sees the same results | All query params in URL, survives refresh | Locked decision |

## Assumptions

1. Single user — no auth needed, all tickets visible to all users.
2. SQLite is acceptable for a take-home; ephemeral on Render free tier is documented honestly.
3. 36 seed tickets is sufficient to demonstrate all features (exceeds the ≥25 requirement).
4. No rich text — description is plain text.
5. No file attachments.
6. No ticket deletion (not mentioned in requirements).
7. No email sending — customer email is data only.
8. "In Progress" status contains a space (not "InProgress").

## MVP vs Bonus

### MVP (must ship within ~5h 15m)

- Complete CRUD: create, list+search+filter+sort+paginate, detail, update status/priority
- Stats endpoint independent of filters
- Shared zod schemas (frontend + backend validation)
- Responsive UI (table → cards)
- Loading/empty/error states
- URL-persisted query state
- Seed data (36 tickets)
- 18+ automated tests (API + frontend)
- README with all required sections
- Screenshots

### Bonus (only after MVP is green, remaining ~45m)

1. Optimistic status update with rollback on error
2. GitHub Actions CI (typecheck + lint + test)
3. Playwright E2E of main flow
4. OpenAPI / docs/API.md
5. Screenshots automation script
