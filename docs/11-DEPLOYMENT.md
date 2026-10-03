# Deployment Guide

This document outlines the production architecture, deployment strategy on Render, environment variables, local production simulation, and the SQLite persistence trade-off.

---

## 1. Architecture: Single-Service Deployment

In production, the application runs as a **single unified service** on Node.js:
- **Build Strategy**:
  - `packages/shared` is consumed directly as TypeScript source.
  - `apps/web` is compiled via `vite build` into static assets in `apps/web/dist`.
  - `apps/api` is bundled via `tsup` into `apps/api/dist/server.js` (ESM bundle with shared inlined and node_modules externalized). `.sql` migration files in `apps/api/migrations/` are read from disk at runtime.
  - The static asset path (`apps/web/dist`) is resolved relative to the server bundle file (`import.meta.url`), not `process.cwd()`.
- **Express Backend** serves the REST API under `/api/*`.
- **Static Assets** from `apps/web/dist` are served by Express using `express.static`.
- **SPA Fallback**: Implemented via plain middleware registered **after** `express.static` and **after** all `/api` routes:
  - Handles `GET` and `HEAD` requests.
  - Skips any path starting with `/api` (allowing unmatched API routes to fall through to the standard JSON 404 handler).
  - All other routes serve `apps/web/dist/index.html`.
  - *(Note: bare `'*'` or `/*` route patterns are invalid in Express 5 / `path-to-regexp` v8 and are not used).*
- **No CORS Issues**: Because the frontend and backend share the exact same origin, CORS headers are not required in production.
- **Port Binding**: Express binds to `process.env.PORT` provided by the cloud platform (defaults to `3001` locally; Render dynamically injects `PORT=10000`).

```
Browser Client
     │
     ▼
Render Service (https://<app-name>.onrender.com)
     │
     ├── /api/health ───────────► Health Check (returns 200 OK)
     ├── /api/tickets/* ────────► Express Router & Controllers
     ├── /assets/* ─────────────► Static files from apps/web/dist
     └── /* (e.g. /tickets/3) ──► SPA fallback (apps/web/dist/index.html)
```

---

## 2. Infrastructure Target: Render Web Service

- **Runtime**: Native Node.js (not Docker), keeping builds fast and dependencies clean.
- **Node Version**: 20 LTS (pinned via `.nvmrc` and `NODE_VERSION` environment variable).
- **Service Type**: Web Service (Free Tier compatible).
- **Package Lock**: `package-lock.json` must be committed to the repository so `npm ci` executes deterministically on Render.

### `render.yaml` Configuration

```yaml
services:
  - type: web
    name: support-ticket-dashboard
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_VERSION
        value: 20.18.0
      - key: NODE_ENV
        value: production
      - key: DATABASE_PATH
        value: ./data/tickets.db
```

---

## 3. Ephemeral Filesystem & SQLite Persistence (Important Caveat)

### The Constraint
On Render's Free Tier, the filesystem is **ephemeral**:
- Any redeployment, instance restart, or idle spin-down wipes changes made to the local filesystem, including SQLite `.db` files.
- Manual changes made through the UI during a session will disappear when Render restarts the container.

### The Mitigation (Auto-Seeding)
On application startup (`npm start`), the server executes:
1. `migrate()`: Runs database migrations creating tables, constraints, and indexes.
2. `seed(ifEmpty = true)`: Queries `SELECT COUNT(*) FROM tickets`. If the count is 0, it seeds all 36 realistic benchmark tickets.
3. If the database already exists and has records, seeding is skipped.
4. **Outcome**: The reviewer is guaranteed to always land on a fully populated, functioning dashboard with realistic tickets, regardless of container restarts or redeployments.

### Production Upgrade Paths (Documented for Reviewers)
1. **Render Persistent Disk**: Attach a persistent disk mount (e.g., `/var/data`) and configure `DATABASE_PATH=/var/data/tickets.db`.
2. **PostgreSQL Migration**: Swap the `ticket.repository.ts` SQLite queries for Postgres via `pg` or `@neondatabase/serverless` connected via `DATABASE_URL`. The repository layer pattern was chosen specifically to make this swap trivial without touching router or service code.

---

## 4. Local Production Simulation

Before pushing to production, verify the production build and server locally:

```bash
# 1. Build all packages (shared, api, web)
npm run build

# 2. Run the production start command (executed from repo root)
# This automatically runs migrations, seeds if DB is empty, and serves the app
npm start

# 3. Test in browser:
# Navigate to: http://localhost:3001
# Test health check: http://localhost:3001/api/health
# Test deep linking: http://localhost:3001/tickets/1
```

---

## 5. Step-by-Step Render Deployment (From GitHub)

1. **Push code to GitHub**:
   Ensure `package-lock.json` is committed:
   ```bash
   git add .
   git commit -m "feat: ready for deployment"
   git push origin main
   ```
2. **Open Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository `support-ticket-dashboard`.
3. **Configure Service**:
   - **Name**: `support-ticket-dashboard`
   - **Region**: Oregon (or nearest)
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. **Environment Variables**:
   - `NODE_VERSION` = `20.18.0`
   - `NODE_ENV` = `production`
   - `DATABASE_PATH` = `./data/tickets.db`
5. **Health Check Path**:
   - Set to `/api/health`.
6. **Deploy**:
   - Click **Create Web Service**.
   - Render runs `npm ci && npm run build`, bundles Express and static web assets, runs DB migrations, and seeds initial data.
   - Note: Render free tier services spin down after 15 minutes of inactivity; initial cold start may take 30-50 seconds.
