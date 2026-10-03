# API Specification

Base URL: `/api`

All responses are JSON. All timestamps are ISO-8601 UTC strings.

---

## Endpoints

### `GET /api/health`

Health check.

**Response `200`**:
```json
{ "status": "ok", "timestamp": "2026-10-03T10:00:00.000Z" }
```

---

### `POST /api/tickets`

Create a new support ticket.

**Request body**:
```json
{
  "title": "string (required, 1-120 chars, trimmed, whitespace-only rejected)",
  "description": "string (required, trimmed, whitespace-only rejected)",
  "customerEmail": "string (required, valid email, lowercased)",
  "priority": "Low | Medium | High (required)",
  "status": "Open | In Progress | Resolved (optional, defaults to Open)"
}
```

**Field Rules & Stripping**:
- **Unknown fields stripped**: Any extra fields (e.g., `id`, `createdAt`, `updatedAt`, `foo`) are stripped by schema validation and never persisted. The client cannot manually set `id` or timestamps.
- `title` is trimmed and validated between 1 and 120 characters; whitespace-only strings are rejected with 400.
- `description` is trimmed; empty strings are rejected with 400.
- `customerEmail` is trimmed and converted to lowercase.
- `priority` must match `'Low' | 'Medium' | 'High'`.
- `status` defaults to `'Open'` if omitted.

**Response `201`**:
```json
{
  "data": {
    "id": 1,
    "title": "Login page broken",
    "description": "Users cannot log in since the last deploy.",
    "customerEmail": "jane@example.com",
    "priority": "High",
    "status": "Open",
    "createdAt": "2026-10-03T10:00:00.000Z",
    "updatedAt": "2026-10-03T10:00:00.000Z"
  }
}
```

**Response `400` (validation error)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "title", "message": "Title is required and must not exceed 120 characters" },
      { "field": "customerEmail", "message": "Invalid email format" }
    ]
  }
}
```

---

### `GET /api/tickets`

List tickets with optional search, filters, sort, and pagination.

**Query parameters**:

| Param | Type | Default | Validation & Handling |
|-------|------|---------|-----------------------|
| `search` | string | (absent) | Case-insensitive LIKE on `title` OR `customer_email`. Wildcards `%` and `_` are escaped with `ESCAPE '\'`. **Rules**: Trimmed; empty string or whitespace-only is treated as absent; maximum length 100 characters (longer -> 400). Repeated param (array) -> 400. |
| `status` | string | (absent) | One of: `Open`, `In Progress`, `Resolved`. Empty string is treated as absent. Invalid value -> 400. Repeated param (array) -> 400. |
| `priority` | string | (absent) | One of: `Low`, `Medium`, `High`. Empty string is treated as absent. Invalid value -> 400. Repeated param (array) -> 400. |
| `sort` | string | `newest` | `newest` (created_at DESC, id DESC) or `oldest` (created_at ASC, id ASC). Repeated param (array) -> 400. |
| `page` | integer | `1` | Must be a positive integer (≥1). Non-integer, <1, or repeated param (array) -> 400. |

**Query Handling Invariants**:
- **Empty strings treated as absent**: Passing `?search=&status=&priority=` is identical to omitting them.
- **Repeated parameters rejected**: If a query parameter appears more than once (e.g. `?status=Open&status=Resolved`), it is rejected with 400.
- **Pagination calculation**: `pagination.totalPages = Math.ceil(total / pageSize)`. When `total === 0`, `totalPages` is `0` (the frontend UI displays "Page 1 of 1" in that case).
- **Out-of-range page**: Requesting a page beyond total pages (e.g., `page=99` when `total=36`) returns `200` with `data: []` and correct `pagination.total` and `totalPages`.

**Response `200`**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Login page broken",
      "description": "Users cannot log in since the last deploy.",
      "customerEmail": "jane@example.com",
      "priority": "High",
      "status": "Open",
      "createdAt": "2026-10-03T10:00:00.000Z",
      "updatedAt": "2026-10-03T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 36,
    "totalPages": 4
  }
}
```

**Response `400`**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      { "field": "search", "message": "Search query must not exceed 100 characters" }
    ]
  }
}
```

---

### `GET /api/tickets/stats`

Summary counts for the entire dataset. **Ignores all query parameters.** Must be registered in the router BEFORE `GET /api/tickets/:id` to avoid `:id` matching "stats".

**Response `200`**:
```json
{
  "data": {
    "total": 36,
    "open": 15,
    "inProgress": 12,
    "resolved": 9
  }
}
```

When database is empty (`total === 0`), returns zeros:
```json
{
  "data": {
    "total": 0,
    "open": 0,
    "inProgress": 0,
    "resolved": 0
  }
}
```

---

### `GET /api/tickets/:id`

Get a single ticket by ID.

**Params**: `id` — positive integer. Non-integer or ≤0 → 400.

**Response `200`**:
```json
{
  "data": {
    "id": 1,
    "title": "Login page broken",
    "description": "Users cannot log in since the last deploy.",
    "customerEmail": "jane@example.com",
    "priority": "High",
    "status": "Open",
    "createdAt": "2026-10-03T10:00:00.000Z",
    "updatedAt": "2026-10-03T10:00:00.000Z"
  }
}
```

**Response `404`**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket with id 999 not found"
  }
}
```

---

### `PATCH /api/tickets/:id`

Update a ticket's status and/or priority.

**Strict Validation Rules**:
1. Only `status` and `priority` are accepted in the request body.
2. Disallows unknown fields (e.g., `title`, `description`, `id`) → 400.
3. At least one of `status` or `priority` must be provided. Empty body (`{}` or undefined) → 400.
4. **Idempotency & Timestamp**: Sending a PATCH where values are identical to current values is permitted, returns `200` with the ticket data, and bumps `updatedAt` to `now()`.
5. Non-numeric or non-positive `id` → 400.

**Request body**:
```json
{
  "status": "In Progress",
  "priority": "High"
}
```

**Response `200`**:
```json
{
  "data": {
    "id": 1,
    "title": "Login page broken",
    "description": "Users cannot log in since the last deploy.",
    "customerEmail": "jane@example.com",
    "priority": "High",
    "status": "In Progress",
    "createdAt": "2026-10-03T10:00:00.000Z",
    "updatedAt": "2026-10-03T10:15:00.000Z"
  }
}
```

**Response `400` (empty body)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one of status or priority is required"
  }
}
```

**Response `400` (unknown fields)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unknown fields: title, description"
  }
}
```

**Response `404`**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket with id 999 not found"
  }
}
```

---

### Unknown routes

Any `GET|POST|PATCH|PUT|DELETE /api/*` that doesn't match a defined route:

**Response `404`**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

---

### Malformed JSON

Any request with `Content-Type: application/json` and unparseable body:

**Response `400`**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Malformed JSON in request body"
  }
}
```

---

## Error Shape (consistent across all errors)

```typescript
interface ErrorResponse {
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
```

- `VALIDATION_ERROR` → 400
- `NOT_FOUND` → 404
- `INTERNAL_ERROR` → 500 (generic message, never leaks stack traces)

---

## Field Name Convention

| DB column | API field (camelCase) |
|-----------|-----------------------|
| `id` | `id` |
| `title` | `title` |
| `description` | `description` |
| `customer_email` | `customerEmail` |
| `priority` | `priority` |
| `status` | `status` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

The repository layer maps snake_case ↔ camelCase.
