# Affiliate Launchpad Business OS

Private internal platform for CRM, sales, marketing, fulfillment, and client management.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Default Login](#default-login)
5. [Module Overview](#module-overview)
6. [Environment Variables](#environment-variables)
7. [API Documentation](#api-documentation)
8. [User Roles](#user-roles)
9. [GoHighLevel Integration](#gohighlevel-integration)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

The **Affiliate Launchpad Business OS** is a private, self-hosted internal platform built to consolidate every operational function of the Affiliate Launchpad business into a single, unified interface. It replaces fragmented spreadsheets and disconnected tools with a purpose-built system covering:

- **CRM & Pipeline** — track leads from first contact through close with a full Kanban pipeline
- **Sales Dashboard** — real-time metrics, leaderboard, revenue tracking, and performance charts
- **Marketing Dashboard** — content tracker, campaign management, and conversion analytics
- **Fulfillment & Client Portal** — manage active clients, deliverables, deadlines, and client-facing portals
- **Resource Library** — centralized storage for SOPs, templates, scripts, and training materials
- **Team & Settings** — user management, role assignments, integrations, and platform configuration

This platform is **not a SaaS product**. It is an internal tool deployed privately for the Affiliate Launchpad team and authorized clients.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                  │
│         React (Vite) — http://localhost:5173         │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / REST API
┌───────────────────▼─────────────────────────────────┐
│          Node.js / Express Backend                  │
│              http://localhost:3001                  │
│                                                     │
│  Routes: /api/auth  /api/leads  /api/sales          │
│          /api/marketing  /api/clients               │
│          /api/resources  /api/users  /api/settings  │
└───────────────────┬─────────────────────────────────┘
                    │ better-sqlite3
┌───────────────────▼─────────────────────────────────┐
│                  SQLite Database                    │
│         ./db/affiliate_launchpad.db                 │
└─────────────────────────────────────────────────────┘
```

| Layer    | Technology          | Port  | Notes                              |
|----------|---------------------|-------|------------------------------------|
| Frontend | React 18 + Vite     | 5173  | SPA, communicates via REST API     |
| Backend  | Node.js + Express   | 3001  | JWT auth, REST endpoints           |
| Database | SQLite (better-sqlite3) | — | File-based, persisted to /db/      |

In production, the React app is built to static files and served directly by Express, so only port 3001 is exposed.

---

## Quick Start

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** — included with Node.js

### Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/your-org/affiliate-launchpad-os.git
cd affiliate-launchpad-os/business-os

# 2. Copy environment variables
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables section)

# 3. Run setup — installs all dependencies and initializes the database
npm run setup

# 4. Start development servers (frontend + backend concurrently)
npm run dev
```

The terminal will show two processes starting:
- `[server]` — Express API on http://localhost:3001
- `[client]` — Vite dev server on http://localhost:5173

Open **http://localhost:5173** in your browser.

### Alternative: Use the setup script

```bash
chmod +x setup.sh
./setup.sh
```

The script provides colored output, error checking, and prints login credentials on completion.

---

## Default Login

> WARNING: Change the admin password immediately after your first login.

| Field    | Value                           |
|----------|---------------------------------|
| Email    | admin@affiliatelaunchpad.com    |
| Password | admin123                        |
| Role     | Admin (full access)             |

To change your password: **Settings → My Profile → Change Password**

---

## Module Overview

### CRM & Pipeline

A full Kanban board with **9 pipeline stages**:

| # | Stage              | Description                                      |
|---|--------------------|--------------------------------------------------|
| 1 | New Lead           | Freshly created or imported contact              |
| 2 | Contacted          | First outreach sent                              |
| 3 | Engaged            | Lead has responded and is in conversation        |
| 4 | Discovery Call     | Call scheduled or completed                      |
| 5 | Proposal Sent      | Offer or proposal delivered                      |
| 6 | Follow-Up          | Awaiting response after proposal                 |
| 7 | Negotiation        | Active negotiation in progress                   |
| 8 | Closed Won         | Deal closed — triggers onboarding automation     |
| 9 | Closed Lost        | Lead did not convert                             |

Each card supports: notes, tasks, tags, assigned rep, next action date, deal value, and activity log.

### Sales Dashboard

- Total revenue (MTD, QTD, YTD)
- Deals closed vs. target
- Pipeline value by stage
- Individual rep leaderboard
- Conversion rate funnel
- Revenue trend chart (line/bar)

### Marketing Dashboard

- Content calendar and tracker
- Campaign performance (impressions, clicks, conversions, spend)
- Lead source attribution
- Content status workflow (Idea → Draft → Review → Published)

### Fulfillment / Client Portal

- Active client roster with onboarding status
- Deliverable tracker with due dates and assignees
- Client-facing portal — clients log in to see their own progress
- File sharing and document uploads per client

### Resource Library

- Categorized document storage (SOPs, scripts, templates, training)
- Tag-based filtering
- Version tracking
- Direct download links

### Team & Settings

- User creation, role assignment, deactivation
- API key management (GHL, SMTP)
- Webhook configuration
- Audit log (admin only)
- White-label settings (logo, brand name)

---

## Environment Variables

All environment variables are defined in `.env` (copy from `.env.example`). The server reads these at startup via `dotenv`.

### Server

| Variable         | Required | Default                    | Description                                           |
|------------------|----------|----------------------------|-------------------------------------------------------|
| `PORT`           | No       | `3001`                     | Port the Express server listens on                    |
| `NODE_ENV`       | No       | `development`              | Set to `production` for production deployments        |

### Authentication

| Variable           | Required | Default | Description                                                        |
|--------------------|----------|---------|--------------------------------------------------------------------|
| `JWT_SECRET`       | Yes      | —       | Secret key used to sign JWT tokens. Use a 64-char random string.   |
| `JWT_EXPIRES_IN`   | No       | `7d`    | Token expiry duration (e.g., `1d`, `7d`, `30d`)                   |

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Database

| Variable         | Required | Default                          | Description                                      |
|------------------|----------|----------------------------------|--------------------------------------------------|
| `DATABASE_PATH`  | No       | `./db/affiliate_launchpad.db`    | File path for the SQLite database                |

In production on Railway, set this to `/app/data/affiliate_launchpad.db` and mount a volume at `/app/data`.

### GoHighLevel Integration

| Variable             | Required | Description                                                        |
|----------------------|----------|--------------------------------------------------------------------|
| `GHL_WEBHOOK_SECRET` | Yes*     | Shared secret to validate inbound GHL webhook requests            |
| `GHL_WEBHOOK_URL`    | Yes*     | GHL webhook URL to POST Closed Won events to                      |
| `GHL_API_KEY`        | Yes*     | GHL API key for direct API calls (contact lookups, etc.)          |

*Required only if using the GoHighLevel integration.

### Email / SMTP

| Variable      | Required | Default          | Description                                           |
|---------------|----------|------------------|-------------------------------------------------------|
| `SMTP_HOST`   | No       | `smtp.gmail.com` | SMTP server hostname                                  |
| `SMTP_PORT`   | No       | `587`            | SMTP port (587 for TLS, 465 for SSL)                  |
| `SMTP_SECURE` | No       | `false`          | Set to `true` if using port 465                       |
| `SMTP_USER`   | No       | —                | SMTP login username (usually your email address)      |
| `SMTP_PASS`   | No       | —                | SMTP password or app-specific password                |
| `NOTIFY_EMAIL`| No       | —                | Address to receive admin notifications                |

### CORS / Frontend

| Variable       | Required | Default                  | Description                                              |
|----------------|----------|--------------------------|----------------------------------------------------------|
| `FRONTEND_URL` | Yes      | `http://localhost:5173`  | Allowed CORS origin. Set to your production domain.      |

---

## API Documentation

Base URL: `http://localhost:3001/api`

Authentication: All protected routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint              | Auth | Description                          |
|--------|-----------------------|------|--------------------------------------|
| POST   | `/auth/login`         | No   | Authenticate and receive JWT token   |
| POST   | `/auth/logout`        | Yes  | Invalidate current session           |
| GET    | `/auth/me`            | Yes  | Get current user profile             |
| PUT    | `/auth/change-password` | Yes | Change current user's password     |

**Login request:**
```json
POST /api/auth/login
{
  "email": "admin@affiliatelaunchpad.com",
  "password": "admin123"
}
```

**Login response:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@affiliatelaunchpad.com",
    "role": "admin"
  }
}
```

### Leads / CRM

| Method | Endpoint              | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/leads`              | Yes  | List all leads (supports filters/search) |
| POST   | `/leads`              | Yes  | Create a new lead manually               |
| GET    | `/leads/:id`          | Yes  | Get a single lead with full detail       |
| PUT    | `/leads/:id`          | Yes  | Update lead fields                       |
| DELETE | `/leads/:id`          | Yes  | Delete a lead (admin only)               |
| PUT    | `/leads/:id/stage`    | Yes  | Move lead to a different pipeline stage  |
| POST   | `/leads/inbound`      | No*  | GHL inbound webhook receiver             |

*Secured by `x-webhook-secret` header rather than JWT.

### Sales

| Method | Endpoint                | Auth | Description                               |
|--------|-------------------------|------|-------------------------------------------|
| GET    | `/sales/metrics`        | Yes  | Revenue, deals closed, conversion metrics |
| GET    | `/sales/leaderboard`    | Yes  | Rep-level performance rankings            |
| GET    | `/sales/pipeline-value` | Yes  | Deal value aggregated by stage            |

### Marketing

| Method | Endpoint                    | Auth | Description                          |
|--------|-----------------------------|------|--------------------------------------|
| GET    | `/marketing/campaigns`      | Yes  | List all campaigns                   |
| POST   | `/marketing/campaigns`      | Yes  | Create a campaign                    |
| PUT    | `/marketing/campaigns/:id`  | Yes  | Update a campaign                    |
| GET    | `/marketing/content`        | Yes  | List content items                   |
| POST   | `/marketing/content`        | Yes  | Add a content item                   |
| PUT    | `/marketing/content/:id`    | Yes  | Update content status                |

### Clients / Fulfillment

| Method | Endpoint                       | Auth | Description                               |
|--------|--------------------------------|------|-------------------------------------------|
| GET    | `/clients`                     | Yes  | List all active clients                   |
| GET    | `/clients/:id`                 | Yes  | Get client detail and deliverables        |
| POST   | `/clients`                     | Yes  | Create a new client record                |
| PUT    | `/clients/:id`                 | Yes  | Update client info                        |
| GET    | `/clients/:id/deliverables`    | Yes  | List deliverables for a client            |
| POST   | `/clients/:id/deliverables`    | Yes  | Add a deliverable                         |
| PUT    | `/clients/:id/deliverables/:dId` | Yes | Update deliverable status               |

### Resources

| Method | Endpoint              | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/resources`          | Yes  | List resources (filter by category/tag)  |
| POST   | `/resources`          | Yes  | Upload or link a resource                |
| PUT    | `/resources/:id`      | Yes  | Update resource metadata                 |
| DELETE | `/resources/:id`      | Yes  | Delete a resource (admin only)           |

### Users & Settings

| Method | Endpoint              | Auth  | Description                              |
|--------|-----------------------|-------|------------------------------------------|
| GET    | `/users`              | Admin | List all users                           |
| POST   | `/users`              | Admin | Create a new user                        |
| PUT    | `/users/:id`          | Admin | Update user details or role              |
| DELETE | `/users/:id`          | Admin | Deactivate a user                        |
| GET    | `/settings`           | Admin | Get current platform settings            |
| PUT    | `/settings`           | Admin | Update settings (SMTP, webhooks, etc.)   |

---

## User Roles

The platform uses a four-tier role system. Roles are assigned per user and enforced at both the API and UI levels.

| Role        | Description                                                    | Access                                                       |
|-------------|----------------------------------------------------------------|--------------------------------------------------------------|
| `admin`     | Full platform access. Manages users, settings, integrations.   | All modules + admin settings                                 |
| `sales`     | Works the pipeline and tracks their own sales performance.     | CRM, Pipeline, Sales Dashboard                               |
| `fulfillment` | Manages active clients and delivers on commitments.          | Clients, Deliverables, Resource Library                      |
| `client`    | External client with limited portal access.                    | Own Client Portal only (deliverables, files, status updates) |

### Role Matrix

| Feature               | Admin | Sales | Fulfillment | Client |
|-----------------------|-------|-------|-------------|--------|
| CRM / Pipeline        | RW    | RW    | R           | —      |
| Sales Dashboard       | RW    | RW    | —           | —      |
| Marketing Dashboard   | RW    | R     | —           | —      |
| Client Fulfillment    | RW    | —     | RW          | R      |
| Resource Library      | RW    | R     | RW          | R*     |
| Team Management       | RW    | —     | —           | —      |
| Settings              | RW    | —     | —           | —      |
| Audit Log             | R     | —     | —           | —      |

*Clients see only resources explicitly shared with them.

---

## GoHighLevel Integration

The Business OS has a two-way sync with GoHighLevel (GHL):

- **Inbound**: New contacts or opportunity status changes in GHL automatically create or update leads in the OS
- **Outbound**: When a lead is moved to "Closed Won" in the OS, an event fires to GHL to trigger the onboarding automation

For complete setup instructions, see [ghl-integration-guide.md](./ghl-integration-guide.md).

### Quick Reference: Inbound Webhook

Set this webhook URL in GHL:
```
https://YOUR_RAILWAY_DOMAIN/api/leads/inbound
```

Required header:
```
x-webhook-secret: YOUR_GHL_WEBHOOK_SECRET
```

### Quick Reference: Closed Won Outbound

When a lead moves to Closed Won, the OS POSTs to your `GHL_WEBHOOK_URL`:
```json
{
  "event": "opportunity.closed_won",
  "lead": {
    "id": 42,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+15551234567",
    "dealValue": 5000,
    "closedAt": "2026-04-13T14:30:00Z",
    "assignedRep": "John Doe"
  }
}
```

---

## Troubleshooting

### "Cannot connect to database"

- Ensure the path in `DATABASE_PATH` exists and is writable
- Run `npm run db:init` to reinitialize the database
- On Railway, confirm the volume is mounted at `/app/data`

### "JWT_SECRET is not defined"

- Copy `.env.example` to `.env` and set `JWT_SECRET`
- The server will refuse to start without this value in production

### CORS errors in browser

- Ensure `FRONTEND_URL` in `.env` exactly matches the origin in your browser (including protocol and port)
- In development: `http://localhost:5173`
- In production: `https://os.affiliatelaunchpad.com`

### GHL webhook not receiving events

- Verify the webhook URL in GHL points to `https://YOUR_DOMAIN/api/leads/inbound`
- Confirm `GHL_WEBHOOK_SECRET` matches the secret header configured in GHL
- Check Railway logs: `railway logs` or the Logs tab in the dashboard
- Use GHL's webhook test feature to send a test payload and inspect the response

### "Port 3001 already in use"

```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Frontend shows blank page after build

- Ensure `npm run build:client` completed without errors
- Check that Express is configured to serve the `client/dist` folder in production
- Verify the `FRONTEND_URL` is set correctly

### Login fails with valid credentials

- The database may not be initialized. Run: `npm run db:init`
- Check that the admin user exists: open the SQLite DB and query the `users` table
- Confirm `JWT_SECRET` is set and has not changed since the token was issued

### SMTP / Email not sending

- For Gmail, use an **App Password** (not your account password) — enable 2FA first, then create an app password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Verify `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` match your provider's settings
- Check server logs for the exact SMTP error message

---

## Development Notes

### Project Structure

```
business-os/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── pages/        # Page-level components (one per module)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── api/          # Axios API client and endpoint helpers
│   │   └── store/        # State management (Zustand or Context)
│   ├── index.html
│   └── package.json
├── server/               # Express backend
│   ├── db/
│   │   ├── database.js   # DB init, schema creation
│   │   └── *.db          # SQLite database file
│   ├── routes/           # Express route handlers
│   ├── middleware/        # Auth, validation, error handling
│   ├── services/         # Business logic, GHL integration
│   └── index.js          # Server entry point
├── .env.example
├── .env                  # Local env (not committed)
├── package.json          # Root orchestration scripts
├── railway.json          # Railway deployment config
├── Procfile              # Heroku/Railway process definition
├── setup.sh              # Interactive setup script
├── README.md             # This file
├── railway-deploy.md     # Railway deployment guide
└── ghl-integration-guide.md  # GHL integration guide
```

### Adding a New Module

1. Create route file: `server/routes/yourmodule.js`
2. Register in `server/index.js`: `app.use('/api/yourmodule', require('./routes/yourmodule'))`
3. Create page component: `client/src/pages/YourModule.jsx`
4. Add to the React router in `client/src/App.jsx`
5. Add navigation link in `client/src/components/Sidebar.jsx`
6. Update roles/permissions in middleware if needed

---

*Affiliate Launchpad Business OS — Internal Use Only*
