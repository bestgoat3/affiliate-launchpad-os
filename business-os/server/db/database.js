'use strict';

const path    = require('path');
const fs      = require('fs');
// Load .env when run directly for seeding
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt  = require('bcryptjs');

// ─── Use built-in node:sqlite (Node 22+) — no native compilation needed ──────
const { DatabaseSync } = require('node:sqlite');

// ─── Minimal better-sqlite3 compatibility shim ───────────────────────────────
// Adds .pragma() and .transaction() so all route files work unchanged.
DatabaseSync.prototype.pragma = function (str) {
  this.exec(`PRAGMA ${str}`);
  return this;
};
DatabaseSync.prototype.transaction = function (fn) {
  const self = this;
  return function (...args) {
    self.exec('BEGIN');
    try {
      const result = fn(...args);
      self.exec('COMMIT');
      return result;
    } catch (err) {
      try { self.exec('ROLLBACK'); } catch (_) {}
      throw err;
    }
  };
};

// ─── Resolve DB path ─────────────────────────────────────────────────────────
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, 'affiliate_launchpad.db');

// Ensure the directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ─── Open / create database ──────────────────────────────────────────────────
const db = new DatabaseSync(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');  // 64 MB

// ─── Initialize schema ───────────────────────────────────────────────────────
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // node:sqlite prepare() only supports DML — use exec() for all DDL.
  // Split on semicolons and exec each statement individually.
  // Strip comment lines from each chunk BEFORE filtering so that blocks
  // starting with "-- Section Header" don't get dropped wholesale.
  const statements = schema
    .split(';')
    .map(s =>
      s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      db.exec(stmt);
    } catch (err) {
      // Ignore "already exists" errors for idempotency
      if (err.message && !err.message.includes('already exists')) {
        console.error('Schema error on:', stmt.slice(0, 80));
        throw err;
      }
    }
  }
}

// ─── Seed data ───────────────────────────────────────────────────────────────
function seedData() {
  // Pipeline stages
  const existingStages = db.prepare('SELECT COUNT(*) as c FROM pipeline_stages').get();
  if (existingStages.c === 0) {
    const stages = [
      { name: 'New Lead',            order_index: 1, color: '#6366f1' },
      { name: 'Booked Call',         order_index: 2, color: '#8b5cf6' },
      { name: 'Call Completed',      order_index: 3, color: '#3b82f6' },
      { name: 'Proposal Sent',       order_index: 4, color: '#f59e0b' },
      { name: 'Closed Won',          order_index: 5, color: '#10b981' },
      { name: 'Onboarding',          order_index: 6, color: '#06b6d4' },
      { name: 'Active Client',       order_index: 7, color: '#22c55e' },
      { name: 'Upsell Opportunity',  order_index: 8, color: '#f97316' },
      { name: 'Churned Lost',        order_index: 9, color: '#ef4444' },
    ];
    const insertStage = db.prepare(
      'INSERT INTO pipeline_stages (name, order_index, color) VALUES (@name, @order_index, @color)'
    );
    const insertAllStages = db.transaction(() => {
      for (const s of stages) insertStage.run(s);
    });
    insertAllStages();
    console.log('✓ Pipeline stages seeded');
  }

  // Admin user
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = 'admin@affiliatelaunchpad.com'").get();
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 12);
    db.prepare(
      `INSERT INTO users (email, password_hash, name, role, active)
       VALUES ('admin@affiliatelaunchpad.com', ?, 'Karl', 'admin', 1)`
    ).run(hash);
    console.log('✓ Admin user seeded (admin@affiliatelaunchpad.com / admin123)');
  }

  // Sample sales rep user
  const existingRep = db.prepare("SELECT id FROM users WHERE email = 'rep@affiliatelaunchpad.com'").get();
  if (!existingRep) {
    const hash = bcrypt.hashSync('rep123', 12);
    db.prepare(
      `INSERT INTO users (email, password_hash, name, role, active)
       VALUES ('rep@affiliatelaunchpad.com', ?, 'Alex Rivera', 'sales', 1)`
    ).run(hash);
    console.log('✓ Sample sales rep seeded (rep@affiliatelaunchpad.com / rep123)');
  }

  // Sample leads
  const existingLeads = db.prepare('SELECT COUNT(*) as c FROM leads').get();
  if (existingLeads.c === 0) {
    const adminId = db.prepare("SELECT id FROM users WHERE email = 'admin@affiliatelaunchpad.com'").get().id;
    const repId   = db.prepare("SELECT id FROM users WHERE email = 'rep@affiliatelaunchpad.com'").get().id;

    const insertLead = db.prepare(`
      INSERT INTO leads
        (first_name, last_name, email, phone, source, monthly_revenue, budget,
         goal_90_days, investment_ready, stage, lead_score, assigned_rep_id, notes, tags)
      VALUES
        (@first_name, @last_name, @email, @phone, @source, @monthly_revenue, @budget,
         @goal_90_days, @investment_ready, @stage, @lead_score, @assigned_rep_id, @notes, @tags)
    `);

    const leads = [
      {
        first_name: 'Sarah', last_name: 'Johnson',
        email: 'sarah.johnson@example.com', phone: '555-0101',
        source: 'TikTok', monthly_revenue: '$15,000', budget: '$5,000',
        goal_90_days: 'Scale to $50k/month', investment_ready: 'Yes',
        stage: 'Booked Call', lead_score: 85, assigned_rep_id: repId,
        notes: 'Very interested, has existing audience', tags: '["hot","tiktok"]',
      },
      {
        first_name: 'Marcus', last_name: 'Thompson',
        email: 'marcus.t@example.com', phone: '555-0202',
        source: 'Instagram', monthly_revenue: '$8,000', budget: '$3,000',
        goal_90_days: 'Build affiliate funnel', investment_ready: 'Maybe',
        stage: 'Proposal Sent', lead_score: 65, assigned_rep_id: repId,
        notes: 'Needs follow-up on pricing questions', tags: '["warm","instagram"]',
      },
      {
        first_name: 'Jessica', last_name: 'Lee',
        email: 'jlee@example.com', phone: '555-0303',
        source: 'YouTube', monthly_revenue: '$25,000', budget: '$10,000',
        goal_90_days: 'Launch high-ticket offer', investment_ready: 'Yes',
        stage: 'Closed Won', lead_score: 95, assigned_rep_id: adminId,
        notes: 'Closed at $9,500. Starting onboarding next week.', tags: '["closed","youtube","vip"]',
      },
    ];

    const seedLeads = db.transaction(() => {
      for (const lead of leads) {
        const result = insertLead.run(lead);
        // Log activity for each lead
        db.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, ?, 'lead_created', 'Lead created via seed data')
        `).run(result.lastInsertRowid, adminId);
      }
    });
    seedLeads();
    console.log('✓ Sample leads seeded');

    // Create client record for Closed Won lead
    const closedLead = db.prepare("SELECT id FROM leads WHERE email = 'jlee@example.com'").get();
    if (closedLead) {
      const clientResult = db.prepare(`
        INSERT INTO clients (lead_id, status, onboarding_started_at, notes, assigned_fulfillment_id)
        VALUES (?, 'Onboarding', datetime('now'), 'VIP client - handle with priority', ?)
      `).run(closedLead.id, adminId);

      const clientId = clientResult.lastInsertRowid;

      // Onboarding checklist
      const tasks = [
        { task_name: 'Welcome call scheduled',        due_date: null },
        { task_name: 'Access to portal granted',      due_date: null },
        { task_name: 'Onboarding questionnaire sent', due_date: null },
        { task_name: 'Strategy doc shared',           due_date: null },
        { task_name: 'First deliverable delivered',   due_date: null },
      ];
      const insertTask = db.prepare(
        'INSERT INTO onboarding_checklist (client_id, task_name, due_date) VALUES (?, ?, ?)'
      );
      const seedTasks = db.transaction(() => {
        for (const t of tasks) insertTask.run(clientId, t.task_name, t.due_date);
      });
      seedTasks();

      // Sample deliverable
      db.prepare(`
        INSERT INTO deliverables (client_id, name, status)
        VALUES (?, 'Affiliate Funnel Strategy Document', 'pending')
      `).run(clientId);

      console.log('✓ Sample client + checklist seeded');
    }
  }

  // Content posts
  const existingPosts = db.prepare('SELECT COUNT(*) as c FROM content_posts').get();
  if (existingPosts.c === 0) {
    db.prepare(`
      INSERT INTO content_posts (platform, format, title, posted_at, views, clicks, leads_generated, notes)
      VALUES
        ('TikTok',    'Hook',     'How I made $10k in 30 days with affiliate marketing', datetime('now', '-7 days'),  45200, 832, 12, 'Top performer this week'),
        ('Instagram', 'Tutorial', '5 affiliate niches that print money in 2025',         datetime('now', '-3 days'),  18700, 420,  6, 'Carousel format worked well')
    `).run();
    console.log('✓ Sample content posts seeded');
  }

  // Campaign
  const existingCampaigns = db.prepare('SELECT COUNT(*) as c FROM campaigns').get();
  if (existingCampaigns.c === 0) {
    db.prepare(`
      INSERT INTO campaigns (name, platform, start_date, end_date, budget_spent, leads_generated, revenue_attributed, cpl, roas, status)
      VALUES ('Q1 TikTok Push', 'TikTok', date('now', '-30 days'), date('now', '+30 days'), 2400.00, 38, 19000.00, 63.16, 7.92, 'active')
    `).run();
    console.log('✓ Sample campaign seeded');
  }

  // Default settings
  const existingSettings = db.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (existingSettings.c === 0) {
    const defaultSettings = [
      { key: 'company_name',          value: 'Affiliate Launchpad' },
      { key: 'timezone',              value: 'America/New_York' },
      { key: 'currency',              value: 'USD' },
      { key: 'notifications_enabled', value: 'true' },
      { key: 'ghl_sync_enabled',      value: 'false' },
    ];
    const insertSetting = db.prepare(
      "INSERT INTO settings (key, value) VALUES (@key, @value)"
    );
    const seedSettings = db.transaction(() => {
      for (const s of defaultSettings) insertSetting.run(s);
    });
    seedSettings();
    console.log('✓ Default settings seeded');
  }
}

// ─── Migrations (ALTER TABLE additions, safe to re-run) ──────────────────────
function runMigrations() {
  const migrations = [
    // Add invite_token column to users for team invite system
    `ALTER TABLE users ADD COLUMN invite_token TEXT`,
    // Add updated_at column to users if not present
    `ALTER TABLE users ADD COLUMN updated_at TEXT`,
    // Create call_logs table for Twilio dialer
    `CREATE TABLE IF NOT EXISTS call_logs (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_call_logs_lead   ON call_logs(lead_id)`,
    `CREATE INDEX IF NOT EXISTS idx_call_logs_user   ON call_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_call_logs_called ON call_logs(called_at)`,
  ];

  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch (err) {
      // "duplicate column name" means it already exists — safe to ignore
      if (err.message && !err.message.toLowerCase().includes('duplicate column')) {
        console.error('Migration error on:', sql);
        throw err;
      }
    }
  }
}

// ─── Run init if called directly ─────────────────────────────────────────────
function initialize() {
  console.log(`Initializing database at: ${DB_PATH}`);
  initSchema();
  runMigrations();
  seedData();
  console.log('Database ready.');
}

if (require.main === module) {
  initialize();
  process.exit(0);
} else {
  // When imported by the server, run migrations automatically on startup
  try { runMigrations(); } catch (e) { console.error('Migration failed:', e.message); }
}

// ─── Export ──────────────────────────────────────────────────────────────────
module.exports = { db, initialize };
