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
