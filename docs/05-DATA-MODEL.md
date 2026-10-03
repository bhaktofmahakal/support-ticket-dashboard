# Data Model

## SQLite Schema

### Migration File: `apps/api/migrations/001_create_tickets.sql`

Migrations are stored in `apps/api/migrations/` (outside `src/`, read at runtime by the migration runner relative to the api package root or `process.env.MIGRATIONS_DIR`).

```sql
CREATE TABLE IF NOT EXISTS tickets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL CHECK(length(trim(title)) > 0 AND length(trim(title)) <= 120),
  description   TEXT    NOT NULL CHECK(length(trim(description)) > 0),
  customer_email TEXT   NOT NULL CHECK(customer_email LIKE '%_@_%.__%'),
  status        TEXT    NOT NULL DEFAULT 'Open'
                        CHECK(status IN ('Open', 'In Progress', 'Resolved')),
  priority      TEXT    NOT NULL CHECK(priority IN ('Low', 'Medium', 'High')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z'),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z')
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority   ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
```

---

## Design Decisions

### Primary Key
- `INTEGER PRIMARY KEY AUTOINCREMENT` — monotonically increasing, simple, avoids UUID overhead.
- Acts as deterministic tie-breaker for pagination: `ORDER BY created_at <DIR>, id <DIR>`.

### Timestamps & Injectable Clock
- Stored as ISO-8601 UTC text strings (`YYYY-MM-DDTHH:MM:SS.sssZ`).
- **Generation**: Timestamps are generated in the application service layer via an injectable clock dependency: `now(): string` (default: `() => new Date().toISOString()`).
- On `INSERT`: Service generates `now()` and repository sets both `created_at` and `updated_at`.
- On `PATCH`: Service generates `now()` and repository executes parameterized update `updated_at = ?`. `created_at` is immutable and never updated.
- **Database Fallbacks**: SQLite default expressions `(strftime('%Y-%m-%dT%H:%M:%f', 'now') || 'Z')` remain in the schema purely as defense-in-depth fallbacks.

### CHECK Constraints
- **Title**: Must be non-empty after trimming, max 120 chars. DB is defense-in-depth after Zod.
- **Description**: Must be non-empty after trimming.
- **Email**: Basic wildcard format check (`%_@_%.__%`). Precise RFC regex validation is handled by Zod.
- **Status**: Enum constraint: `('Open', 'In Progress', 'Resolved')`.
- **Priority**: Enum constraint: `('Low', 'Medium', 'High')`.

### Performance Indexes
- `idx_tickets_status` on `tickets(status)`: Accelerates `WHERE status = ?`.
- `idx_tickets_priority` on `tickets(priority)`: Accelerates `WHERE priority = ?`.
- `idx_tickets_created_at` on `tickets(created_at)`: Accelerates `ORDER BY created_at`.

### WAL Mode
- Enabled on database connection: `db.pragma('journal_mode = WAL')`.
- Enhances concurrent read throughput during active writes.

### Data Directory
- Default database location: `./data/tickets.db` (configurable via `DATABASE_PATH` env var).
- Directory auto-created on connection initialization if absent.
- Git excludes `data/` via `.gitignore`.

---

## Column-to-API Mapping

| DB Column | Type | Nullable | API Field (camelCase) | Mapping Notes |
|-----------|------|----------|-----------------------|---------------|
| `id` | INTEGER | NO | `id` | Monotonic integer |
| `title` | TEXT | NO | `title` | Trimmed, 1-120 chars |
| `description` | TEXT | NO | `description` | Trimmed non-empty string |
| `customer_email` | TEXT | NO | `customerEmail` | Lowercased |
| `status` | TEXT | NO | `status` | 'Open', 'In Progress', 'Resolved' |
| `priority` | TEXT | NO | `priority` | 'Low', 'Medium', 'High' |
| `created_at` | TEXT | NO | `createdAt` | ISO-8601 UTC string (immutable) |
| `updated_at` | TEXT | NO | `updatedAt` | ISO-8601 UTC string (refreshed on PATCH) |

---

## Seed Data Summary

36 benchmark tickets, inserted idempotently (only if table count is 0):
- **Status distribution**: ~12 Open, ~12 In Progress, ~12 Resolved
- **Priority distribution**: ~12 Low, ~12 Medium, ~12 High
- **Fixed Timestamps**: Explicit ISO-8601 timestamps passed during seeding (including identical timestamps to test deterministic tie-breaker sorting).
- **Edge cases covered**:
  - Exact 120-character title
  - Duplicate `created_at` timestamps across records
  - Mixed-case emails lowercased on insert
  - Clustered email domains (`@acme.com`, `@support.org`) for partial search
  - Varied realistic support issues

---

## Update Semantics

On `PATCH /api/tickets/:id`:
1. Accepts only `status` and/or `priority`.
2. Rejects unknown fields (`400 VALIDATION_ERROR`).
3. Rejects empty body (`400 VALIDATION_ERROR`).
4. Timestamps: Repository executes parameterized SQL:
   ```sql
   UPDATE tickets
   SET status = COALESCE(?, status),
       priority = COALESCE(?, priority),
       updated_at = ?
   WHERE id = ?;
   ```
5. `created_at` is untouched.
6. Returns full updated ticket object: `{ data: Ticket }`.
