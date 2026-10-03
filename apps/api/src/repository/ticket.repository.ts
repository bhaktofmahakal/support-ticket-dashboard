import type Database from 'better-sqlite3';
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  ListQuery,
  TicketStats,
} from '@support-ticket/shared';

export interface DbTicketRow {
  id: number;
  title: string;
  description: string;
  customer_email: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function escapeLikeWildcards(str: string): string {
  // Escapes %, _ and \ so they are matched literally with ESCAPE '\'
  return str.replace(/[%_\\]/g, '\\$&');
}

export function toTicket(row: DbTicketRow): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    customerEmail: row.customer_email,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TicketRepository {
  constructor(private db: Database.Database) {}

  create(
    data: {
      title: string;
      description: string;
      customerEmail: string;
      priority: TicketPriority;
      status: TicketStatus;
    },
    timestamps: { createdAt: string; updatedAt: string }
  ): Ticket {
    const stmt = this.db.prepare(`
      INSERT INTO tickets (
        title,
        description,
        customer_email,
        status,
        priority,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.title.trim(),
      data.description.trim(),
      data.customerEmail.toLowerCase().trim(),
      data.status,
      data.priority,
      timestamps.createdAt,
      timestamps.updatedAt
    );

    const inserted = this.findById(Number(result.lastInsertRowid));
    if (!inserted) {
      throw new Error('Failed to retrieve newly inserted ticket');
    }
    return inserted;
  }

  findById(id: number): Ticket | null {
    const stmt = this.db.prepare('SELECT * FROM tickets WHERE id = ?');
    const row = stmt.get(id) as DbTicketRow | undefined;
    return row ? toTicket(row) : null;
  }

  list(query: ListQuery): { tickets: Ticket[]; total: number; totalPages: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Search condition across title OR customer_email with wildcard escaping
    if (query.search && query.search.trim().length > 0) {
      const escaped = escapeLikeWildcards(query.search.trim());
      conditions.push(
        "(title LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\')"
      );
      params.push(`%${escaped}%`, `%${escaped}%`);
    }

    // Status filter
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    // Priority filter
    if (query.priority) {
      conditions.push('priority = ?');
      params.push(query.priority);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total count query
    const countSql = `SELECT COUNT(*) AS total FROM tickets ${whereClause}`;
    const countRow = this.db.prepare(countSql).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    const pageSize = 10;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    // 2. Data query with deterministic tie-breaker sorting
    const sortDir = query.sort === 'oldest' ? 'ASC' : 'DESC';
    const orderBy = `ORDER BY created_at ${sortDir}, id ${sortDir}`;
    const offset = (query.page - 1) * pageSize;

    const listSql = `
      SELECT * FROM tickets
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, pageSize, offset];
    const rows = this.db.prepare(listSql).all(...dataParams) as DbTicketRow[];
    const tickets = rows.map(toTicket);

    return {
      tickets,
      total,
      totalPages,
    };
  }

  updateStatusPriority(
    id: number,
    updates: { status?: TicketStatus; priority?: TicketPriority },
    updatedAt: string
  ): Ticket | null {
    // If ticket doesn't exist, return null early
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const stmt = this.db.prepare(`
      UPDATE tickets
      SET status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updates.status ?? null,
      updates.priority ?? null,
      updatedAt,
      id
    );

    return this.findById(id);
  }

  stats(): TicketStats {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END), 0) AS open,
        COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS inProgress,
        COALESCE(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved
      FROM tickets
    `);

    const row = stmt.get() as {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
    };

    return {
      total: Number(row.total || 0),
      open: Number(row.open || 0),
      inProgress: Number(row.inProgress || 0),
      resolved: Number(row.resolved || 0),
    };
  }
}
