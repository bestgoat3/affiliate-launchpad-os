-- Affiliate Launchpad Business OS — Full Database Schema
-- SQLite dialect

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK(role IN ('admin','sales','fulfillment','client')) DEFAULT 'sales',
  avatar_url    TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- PIPELINE STAGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color       TEXT    NOT NULL DEFAULT '#6366f1'
);

-- ─────────────────────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name       TEXT    NOT NULL,
  last_name        TEXT    NOT NULL DEFAULT '',
  email            TEXT,
  phone            TEXT,
  source           TEXT,
  monthly_revenue  TEXT,
  budget           TEXT,
  goal_90_days     TEXT,
  investment_ready TEXT,
  stage            TEXT    NOT NULL DEFAULT 'New Lead'
                   CHECK(stage IN (
                     'New Lead','Booked Call','Call Completed',
                     'Proposal Sent','Closed Won','Onboarding',
                     'Active Client','Upsell Opportunity','Churned Lost'
                   )),
  lead_score       INTEGER DEFAULT 0,
  assigned_rep_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  call_date        TEXT,
  notes            TEXT,
  tags             TEXT    DEFAULT '[]',
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_rep ON leads(assigned_rep_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- ─────────────────────────────────────────────────────────────
-- LEAD NOTES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);

-- ─────────────────────────────────────────────────────────────
-- LEAD ACTIVITIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_activities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at);

-- ─────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id               INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  user_id               INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status                TEXT    NOT NULL DEFAULT 'Onboarding'
                        CHECK(status IN ('Onboarding','Active','Completed')),
  onboarding_started_at TEXT,
  active_since          TEXT,
  notes                 TEXT,
  assigned_fulfillment_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_lead ON clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- ─────────────────────────────────────────────────────────────
-- ONBOARDING CHECKLIST
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  task_name    TEXT    NOT NULL,
  completed    INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  due_date     TEXT
);

CREATE INDEX IF NOT EXISTS idx_checklist_client ON onboarding_checklist(client_id);

-- ─────────────────────────────────────────────────────────────
-- DELIVERABLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliverables (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name      TEXT    NOT NULL,
  status    TEXT    NOT NULL DEFAULT 'pending'
            CHECK(status IN ('pending','sent','completed')),
  sent_at   TEXT,
  notes     TEXT
);

CREATE INDEX IF NOT EXISTS idx_deliverables_client ON deliverables(client_id);

-- ─────────────────────────────────────────────────────────────
-- RESOURCES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  title              TEXT    NOT NULL,
  description        TEXT,
  type               TEXT    NOT NULL CHECK(type IN ('pdf','link','video')),
  url                TEXT    NOT NULL,
  visible_to_clients INTEGER NOT NULL DEFAULT 0,
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- CONTENT POSTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  platform        TEXT NOT NULL CHECK(platform IN ('TikTok','Instagram','YouTube')),
  format          TEXT NOT NULL CHECK(format IN ('Hook','Story','CTA','Tutorial')),
  title           TEXT NOT NULL,
  posted_at       TEXT,
  views           INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL,
  platform          TEXT,
  start_date        TEXT,
  end_date          TEXT,
  budget_spent      REAL    DEFAULT 0,
  leads_generated   INTEGER DEFAULT 0,
  revenue_attributed REAL   DEFAULT 0,
  cpl               REAL    DEFAULT 0,
  roas              REAL    DEFAULT 0,
  status            TEXT    NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active','paused','completed')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  email      TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- API KEYS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  key_hash   TEXT NOT NULL,
  service    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────────────────────
-- CALL LOGS (Twilio Dialer)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id          INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  direction        TEXT    NOT NULL DEFAULT 'outbound',
  phone_number     TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  disposition      TEXT    CHECK(disposition IN ('answered','no-answer','voicemail','busy')),
  notes            TEXT,
  twilio_call_sid  TEXT,
  called_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead   ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user   ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_called ON call_logs(called_at);
