# Extending the Application

This guide walks through adding a new field, filter, or status end-to-end. It's designed for the follow-up interview where you'll be asked to "make a small change."

---

## Example 1: Add a new field — `category` (e.g., "Billing", "Technical", "General")

### Step 1: Shared Schema (`packages/shared/src/schemas/ticket.ts`)

```typescript
// Add to the category enum
export const categoryEnum = z.enum(['Billing', 'Technical', 'General']);

// Add to createTicketSchema
category: categoryEnum,

// Add to updateTicketSchema (if it should be editable)
category: categoryEnum.optional(),
```

### Step 2: Database Migration (`apps/api/migrations/002_add_category.sql`)

```sql
ALTER TABLE tickets ADD COLUMN category TEXT NOT NULL DEFAULT 'General'
  CHECK(category IN ('Billing', 'Technical', 'General'));

CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
```

### Step 3: Repository (`apps/api/src/repository/ticket.repository.ts`)

- Add `category` to the INSERT column list in `create()`
- Add `category` to the column-mapping in `toTicket()` (snake_case → camelCase, though `category` is the same)
- Add optional WHERE clause in `findMany()`:
  ```typescript
  if (query.category) {
    conditions.push('category = ?');
    params.push(query.category);
  }
  ```

### Step 4: Seed Data (`apps/api/src/db/seed.ts`)

Add `category` values to each seed ticket. Vary them across the 36 tickets.

### Step 5: Frontend — Filter Control (`apps/web/src/components/FilterBar.tsx`)

Add a `<select>` for category with options: All, Billing, Technical, General.

### Step 6: Frontend — URL State (`apps/web/src/hooks/useUrlState.ts`)

Add `category` to the URL params object, same pattern as `status` and `priority`.

### Step 7: Frontend — Display (`apps/web/src/components/`)

- Add a `CategoryBadge.tsx` component (copy `StatusBadge` pattern)
- Add the badge to `TicketTable.tsx` and `TicketCard.tsx`
- Add to `TicketDetail.tsx` detail view

### Step 8: Tests

- API: validation test for invalid category, filter test for category
- Frontend: badge renders, filter works

### Files Touched (summary)

| Layer | File | Change |
|-------|------|--------|
| Schema | `packages/shared/src/schemas/ticket.ts` | Add enum + field |
| Migration | `apps/api/migrations/002_add_category.sql` | ALTER TABLE |
| Repository | `apps/api/src/repository/ticket.repository.ts` | Insert, select, filter |
| Seed | `apps/api/src/db/seed.ts` | Add field values |
| Frontend | `FilterBar.tsx`, `CategoryBadge.tsx`, `TicketTable.tsx`, `TicketCard.tsx`, `TicketDetail.tsx`, `useUrlState.ts` | UI + state |
| Tests | Validation + filter tests | New test cases |

---

## Example 2: Add a new status — "Closed"

### Step 1: Shared Schema

```typescript
export const statusEnum = z.enum(['Open', 'In Progress', 'Resolved', 'Closed']);
```

### Step 2: Database Migration

```sql
-- SQLite CHECK constraints can't be altered in-place.
-- Option A: Create new table, copy data, rename.
-- Option B: For a demo, just update the seed/initial migration.
-- For the interview, explain the tradeoff.
```

### Step 3: Stats Endpoint

Add `closed` to the stats response:
```json
{
  "data": {
    "total": 36,
    "open": 10,
    "inProgress": 12,
    "resolved": 9,
    "closed": 5
  }
}
```

### Step 4: Frontend

- Update `StatusBadge` color map
- Update `StatsCards` to show 4th card
- Update filter dropdown

---

## Example 3: Add a new filter — date range

### Step 1: Shared Schema

```typescript
// In querySchema
createdAfter: z.string().datetime().optional(),
createdBefore: z.string().datetime().optional(),
```

### Step 2: Repository

```typescript
if (query.createdAfter) {
  conditions.push('created_at >= ?');
  params.push(query.createdAfter);
}
if (query.createdBefore) {
  conditions.push('created_at <= ?');
  params.push(query.createdBefore);
}
```

### Step 3: Frontend

Add date picker inputs to FilterBar, sync with URL state.

---

## Architecture Invariants

When extending, always maintain these rules:

1. **Schema first**: Define the zod schema in `packages/shared` before writing any other code.
2. **Migrate, don't edit**: Create a new numbered migration file. Never edit existing migrations.
3. **Repository isolation**: SQL only lives in the repository layer.
4. **Service logic**: Business rules (defaults, validation beyond zod) live in the service layer.
5. **URL state**: Every filter/sort/search param must be in the URL.
6. **Tests**: Every new field/filter needs at least one API test and one frontend test.
