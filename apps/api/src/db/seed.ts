import type Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { getDatabase } from './connection.js';

export interface SeedTicket {
  title: string;
  description: string;
  customerEmail: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  updatedAt: string;
}

// Exactly 120 characters title for edge case testing:
const TITLE_EXACT_120 =
  'Enterprise SSO integration with Okta SAML 2.0 identity provider returning invalid signature on user login callback (URG)';

export const BENCHMARK_TICKETS: SeedTicket[] = [
  // 1-12: Open tickets (4 High, 4 Medium, 4 Low)
  {
    title: TITLE_EXACT_120,
    description: 'Our enterprise authentication cluster started rejecting Okta assertions after certificate renewal.',
    customerEmail: 'Alex.Rivers@ACME.corp',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-15T09:00:00.000Z',
  },
  {
    title: 'Payment webhook returning HTTP 500 on recurring billing renewals',
    description: 'Stripe subscription webhooks are failing intermittently, causing account suspensions.',
    customerEmail: 'billing-ops@globex.com',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-09-15T09:00:00.000Z', // Deliberate duplicate createdAt with Ticket 1
    updatedAt: '2026-09-15T09:00:00.000Z',
  },
  {
    title: 'Database connection pool exhausted during morning peak traffic',
    description: 'Postgres connection pool maxes out at 100 connections between 8am and 10am EST.',
    customerEmail: 'devops@initech.io',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-09-16T10:15:00.000Z',
    updatedAt: '2026-09-16T10:15:00.000Z',
  },
  {
    title: 'Security vulnerability: CORS wildcard header detected on internal telemetry API',
    description: 'Security audit identified Access-Control-Allow-Origin: * on sensitive telemetry endpoints.',
    customerEmail: 'sec-audit@acme.corp',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-09-17T11:30:00.000Z',
    updatedAt: '2026-09-17T11:30:00.000Z',
  },
  {
    title: 'CSV export times out on datasets exceeding 50,000 records',
    description: 'Exporting transaction reports for Q3 terminates with gateway timeout after 60 seconds.',
    customerEmail: 'finance@globex.com',
    priority: 'Medium',
    status: 'Open',
    createdAt: '2026-09-18T13:00:00.000Z',
    updatedAt: '2026-09-18T13:00:00.000Z',
  },
  {
    title: 'User avatar upload fails silently when image exceeds 2MB',
    description: 'No error message is displayed in profile settings when uploading oversized PNG images.',
    customerEmail: 'support-team@initech.io',
    priority: 'Medium',
    status: 'Open',
    createdAt: '2026-09-19T14:45:00.000Z',
    updatedAt: '2026-09-19T14:45:00.000Z',
  },
  {
    title: 'Notification email delay of up to 45 minutes on password reset requests',
    description: 'Sendgrid delivery queues are experiencing severe backpressure during European business hours.',
    customerEmail: 'Admin@UmbrellaCorp.net',
    priority: 'Medium',
    status: 'Open',
    createdAt: '2026-09-20T08:20:00.000Z',
    updatedAt: '2026-09-20T08:20:00.000Z',
  },
  {
    title: 'Two-factor authentication prompt appears twice on Safari iOS 18',
    description: 'Mobile web users on Safari report being prompted for TOTP code twice in a row.',
    customerEmail: 'mobile-qa@globex.com',
    priority: 'Medium',
    status: 'Open',
    createdAt: '2026-09-21T16:10:00.000Z',
    updatedAt: '2026-09-21T16:10:00.000Z',
  },
  {
    title: 'Dark mode contrast issue on secondary navigation buttons',
    description: 'Subtle gray text on dark gray container fails WCAG AA contrast ratio standards.',
    customerEmail: 'design-system@acme.corp',
    priority: 'Low',
    status: 'Open',
    createdAt: '2026-09-22T09:40:00.000Z',
    updatedAt: '2026-09-22T09:40:00.000Z',
  },
  {
    title: 'Typo in footer copyright year showing 2024 instead of current year',
    description: 'Public marketing footer still displays outdated copyright string on several subpages.',
    customerEmail: 'webmaster@initech.io',
    priority: 'Low',
    status: 'Open',
    createdAt: '2026-09-23T11:00:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z',
  },
  {
    title: 'Documentation link for REST API v2 returns 404 in developer portal',
    description: 'The hyperlink pointing to /docs/api/v2 in the onboarding guide is broken.',
    customerEmail: 'developer@partner-corp.com',
    priority: 'Low',
    status: 'Open',
    createdAt: '2026-09-24T15:25:00.000Z',
    updatedAt: '2026-09-24T15:25:00.000Z',
  },
  {
    title: 'Sort order icon does not toggle state visually in billing history table',
    description: 'Arrow icon remains pointing downwards even when sorting ascending by transaction date.',
    customerEmail: 'accounting@acme.corp',
    priority: 'Low',
    status: 'Open',
    createdAt: '2026-09-25T17:50:00.000Z',
    updatedAt: '2026-09-25T17:50:00.000Z',
  },

  // 13-24: In Progress tickets (4 High, 4 Medium, 4 Low)
  {
    title: 'Redis cluster failover caused dropped WebSocket sessions for active users',
    description: 'Engineering team is investigating connection loss during scheduled node maintenance.',
    customerEmail: 'infra-alerts@globex.com',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-09-26T08:00:00.000Z',
    updatedAt: '2026-09-26T09:30:00.000Z',
  },
  {
    title: 'Critical memory leak identified in background PDF generation worker pool',
    description: 'Worker memory consumption climbs to 98% after generating batch invoices.',
    customerEmail: 'lead-dev@initech.io',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-09-27T10:00:00.000Z',
    updatedAt: '2026-09-27T12:00:00.000Z',
  },
  {
    title: 'Audit log entries missing IP addresses for bulk delete operations',
    description: 'Compliance investigation discovered empty client_ip field on bulk deletion events.',
    customerEmail: 'compliance@acme.corp',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-09-28T11:15:00.000Z',
    updatedAt: '2026-09-28T13:45:00.000Z',
  },
  {
    title: 'Rate limiter blocking legitimate automated sync requests from Shopify connector',
    description: 'IP throttling threshold is too aggressive for enterprise store synchronization.',
    customerEmail: 'integrations@globex.com',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2026-09-29T14:30:00.000Z',
    updatedAt: '2026-09-29T15:10:00.000Z',
  },
  {
    title: 'Search indexing lag causing newly added tickets to appear with 10-minute delay',
    description: 'Elasticsearch sync queue backlog caused by high ingestion volume.',
    customerEmail: 'search-team@initech.io',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-09-30T09:10:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
  },
  {
    title: 'Webhook retry backoff logic retrying too rapidly on HTTP 429 responses',
    description: 'Exponential backoff with jitter implementation needs adjustment for rate-limited targets.',
    customerEmail: 'api-gateway@acme.corp',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-10-01T10:45:00.000Z',
    updatedAt: '2026-10-01T11:30:00.000Z',
  },
  {
    title: 'User invitations expiring after 12 hours instead of documented 48 hours',
    description: 'Token TTL configuration was incorrectly set to 43200 seconds in staging and production.',
    customerEmail: 'hr-support@globex.com',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-10-01T13:20:00.000Z',
    updatedAt: '2026-10-01T14:00:00.000Z',
  },
  {
    title: 'Browser tab freeze when rendering large JSON payloads in debug viewer',
    description: 'Virtual scrolling needs to be added to the raw payload inspection modal.',
    customerEmail: 'frontend-eng@initech.io',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-10-01T15:00:00.000Z',
    updatedAt: '2026-10-01T16:15:00.000Z',
  },
  {
    title: 'Console warning on dashboard load regarding unmounted component state update',
    description: 'React state update triggered after ticket count query completes on navigate away.',
    customerEmail: 'qa-tester@acme.corp',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-10-02T08:30:00.000Z',
    updatedAt: '2026-10-02T09:15:00.000Z',
  },
  {
    title: 'Favicon missing on sub-domain landing pages',
    description: 'CDN path to favicon.ico is relative instead of absolute on custom domains.',
    customerEmail: 'brand@globex.com',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:45:00.000Z',
  },
  {
    title: 'Keyboard focus indicator invisible on date picker calendar days',
    description: 'Focus outline is hidden behind cell border overflow styling.',
    customerEmail: 'a11y-advocate@initech.io',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-10-02T12:00:00.000Z',
    updatedAt: '2026-10-02T12:50:00.000Z',
  },
  {
    title: 'Export filename does not include current date timestamp suffix',
    description: 'Users request tickets-export-YYYY-MM-DD.csv naming convention instead of static tickets.csv.',
    customerEmail: 'ops-lead@acme.corp',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-10-02T14:15:00.000Z',
    updatedAt: '2026-10-02T15:00:00.000Z',
  },

  // 25-36: Resolved tickets (4 High, 4 Medium, 4 Low)
  {
    title: 'Production outage: DNS propagation failure following Nameserver migration',
    description: 'Root domain was unreachable for 18 minutes due to misconfigured TTL on Cloudflare registrar.',
    customerEmail: 'noc@globex.com',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-09-01T04:00:00.000Z',
    updatedAt: '2026-09-01T04:45:00.000Z',
  },
  {
    title: 'Data corruption bug during simultaneous team member role upgrades',
    description: 'Row-level locking added to prevent race condition during permissions updates.',
    customerEmail: 'security@initech.io',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-09-02T11:00:00.000Z',
    updatedAt: '2026-09-02T13:30:00.000Z',
  },
  {
    title: 'SSL certificate expired on legacy analytics ingestion gateway',
    description: 'Automated Let’s Encrypt renewal script repaired and certificate refreshed.',
    customerEmail: 'sysadmin@acme.corp',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-09-03T07:15:00.000Z',
    updatedAt: '2026-09-03T07:50:00.000Z',
  },
  {
    title: 'Zero-day security patch applied to internal Docker base images',
    description: 'Patched OpenSSL vulnerabilities across all containerized production clusters.',
    customerEmail: 'devops-lead@globex.com',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-09-04T16:00:00.000Z',
    updatedAt: '2026-09-04T18:00:00.000Z',
  },
  {
    title: 'Weekly automated email summary failed to trigger on Sunday midnight',
    description: 'Cron scheduler timezone discrepancy resolved; shifted from UTC to America/New_York.',
    customerEmail: 'product@initech.io',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-09-05T08:30:00.000Z',
    updatedAt: '2026-09-05T10:15:00.000Z',
  },
  {
    title: 'Incorrect tax calculation on Canadian purchases with PST/GST breakdown',
    description: 'Updated tax engine rates table for British Columbia and Quebec provinces.',
    customerEmail: 'accounting@globex.com',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-09-06T13:00:00.000Z',
    updatedAt: '2026-09-06T15:45:00.000Z',
  },
  {
    title: 'Broken pagination links when navigating past page 20 on ticket table',
    description: 'Fixed integer overflow error in offset calculation logic.',
    customerEmail: 'feedback@acme.corp',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-09-07T14:20:00.000Z',
    updatedAt: '2026-09-07T16:00:00.000Z',
  },
  {
    title: 'Customer organization names with ampersands encoded incorrectly as &amp;',
    description: 'Sanitization function unescaping HTML entities prior to table rendering.',
    customerEmail: 'crm-admin@initech.io',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-09-08T10:00:00.000Z',
    updatedAt: '2026-09-08T11:30:00.000Z',
  },
  {
    title: 'Tooltips sticking on screen after clicking dropdown buttons',
    description: 'Added dismiss-on-click event listener to portal tooltip wrapper component.',
    customerEmail: 'ux-team@globex.com',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-09-09T09:15:00.000Z',
    updatedAt: '2026-09-09T10:00:00.000Z',
  },
  {
    title: 'Help modal shortcut key (?) conflicting with browser text search',
    description: 'Scoped global keyboard shortcut listener to non-input focus states only.',
    customerEmail: 'accessibility@acme.corp',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-09-10T11:40:00.000Z',
    updatedAt: '2026-09-10T12:20:00.000Z',
  },
  {
    title: 'Missing translation string in French locale for "Clear Filters" button',
    description: 'Added "Effacer les filtres" key to i18n dictionary json file.',
    customerEmail: 'localization@initech.io',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-09-11T14:00:00.000Z',
    updatedAt: '2026-09-11T14:45:00.000Z',
  },
  {
    title: 'Print stylesheet printing background colors inconsistently in Chrome',
    description: 'Added -webkit-print-color-adjust: exact CSS property to report print container.',
    customerEmail: 'reports@globex.com',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-09-12T16:30:00.000Z',
    updatedAt: '2026-09-12T17:10:00.000Z',
  },
];

export function seedDatabase(
  db: Database.Database = getDatabase(),
  options: { reset?: boolean; ifEmpty?: boolean } = {}
): number {
  const { reset = false, ifEmpty = true } = options;

  if (ifEmpty && !reset) {
    const existingCount = db
      .prepare('SELECT COUNT(*) as count FROM tickets')
      .get() as { count: number };
    if (existingCount.count > 0) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Seed] Database already contains ${existingCount.count} tickets. Skipping seed.`);
      }
      return 0;
    }
  }

  const insertTicket = db.transaction(() => {
    if (reset) {
      db.exec('DELETE FROM tickets;');
      db.exec("DELETE FROM sqlite_sequence WHERE name = 'tickets';");
      if (process.env.NODE_ENV !== 'test') {
        console.log('[Seed] Cleared existing tickets table.');
      }
    }

    const insertStmt = db.prepare(`
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

    for (const ticket of BENCHMARK_TICKETS) {
      insertStmt.run(
        ticket.title,
        ticket.description,
        ticket.customerEmail.toLowerCase().trim(),
        ticket.status,
        ticket.priority,
        ticket.createdAt,
        ticket.updatedAt
      );
    }
  });

  insertTicket();
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Seed] Successfully seeded ${BENCHMARK_TICKETS.length} tickets.`);
  }
  return BENCHMARK_TICKETS.length;
}

// Direct CLI invocation
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const shouldReset = process.argv.includes('--reset');
    const seededCount = seedDatabase(getDatabase(), { reset: shouldReset });
    console.log(`[Seed] Finished. Total rows inserted: ${seededCount}`);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err);
    process.exit(1);
  }
}
