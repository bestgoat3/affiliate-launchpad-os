'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { db }   = require('../db/database');
const { authenticate }               = require('../middleware/auth');
const { requireAdmin, requireRoles } = require('../middleware/roles');

const router = express.Router();

router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════════
// TEAM MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/team  — list team members (admin only)
router.get('/team', requireAdmin, (req, res) => {
  const members = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.active, u.created_at
    FROM users u
    WHERE u.role != 'client'
    ORDER BY u.created_at DESC
  `).all();
  return res.json({ members });
});

// POST /api/team  — create a new team member (admin only)
router.post('/team', requireAdmin, (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name, and password are required' });
  }

  const validRoles = ['admin', 'sales', 'fulfillment'];
  const userRole = validRoles.includes(role) ? role : 'sales';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, active)
      VALUES (?, ?, ?, ?, 1)
    `).run(email.toLowerCase().trim(), name.trim(), hash, userRole);

    const member = db.prepare(`
      SELECT id, email, name, role, avatar_url, active, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({ member });
  } catch (err) {
    console.error('Create team member error:', err);
    return res.status(500).json({ error: 'Failed to create team member' });
  }
});

// PUT /api/team/:id  — update team member role/status (admin only)
router.put('/team/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, role, active } = req.body;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Team member not found' });

  // Prevent demoting yourself if you're the only admin
  if (req.user.id === id && role && role !== 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND active = 1").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the only admin account' });
    }
  }

  const validRoles = ['admin', 'sales', 'fulfillment'];
  const newRole   = role && validRoles.includes(role) ? role : existing.role;
  const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

  db.prepare(`
    UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?
  `).run(name || existing.name, newRole, newActive, id);

  const updated = db.prepare(`
    SELECT id, email, name, role, avatar_url, active, created_at
    FROM users WHERE id = ?
  `).get(id);
  return res.json({ member: updated });
});

// DELETE /api/team/:id  (admin only, cannot delete self)
router.delete('/team/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Team member not found' });

  // Soft delete — deactivate instead
  db.prepare("UPDATE users SET active = 0 WHERE id = ?").run(id);
  return res.json({ success: true });
});

// ─── POST /api/settings/team/invite ─────────────────────────────────────────
// Creates an inactive user with a random invite token and returns the invite link.
router.post('/team/invite', requireAdmin, (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'email and name are required' });
  }

  const validRoles = ['admin', 'sales', 'fulfillment'];
  const userRole = validRoles.includes(role) ? role : 'sales';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const tempHash    = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

  try {
    const result = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, active, invite_token)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(email.toLowerCase().trim(), name.trim(), tempHash, userRole, inviteToken);

    const baseUrl   = process.env.APP_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/set-password?token=${inviteToken}`;

    return res.status(201).json({
      success: true,
      invite_url: inviteUrl,
      user: { id: result.lastInsertRowid, email: email.toLowerCase().trim(), name: name.trim(), role: userRole },
    });
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: 'Failed to create invite' });
  }
});

// ─── GET /api/settings/team ──────────────────────────────────────────────────
// List all team members (alias for GET /api/team, under /api/settings path)
router.get('/settings/team', requireAdmin, (req, res) => {
  const members = db.prepare(`
    SELECT id, email, name, role, avatar_url, active, created_at,
           CASE WHEN invite_token IS NOT NULL THEN 1 ELSE 0 END AS pending_invite
    FROM users
    WHERE role != 'client'
    ORDER BY created_at DESC
  `).all();
  return res.json({ members });
});

// ─── PUT /api/settings/team/:id ──────────────────────────────────────────────
router.put('/settings/team/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, role, active } = req.body;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Team member not found' });

  if (req.user.id === id && role && role !== 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND active = 1").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the only admin account' });
    }
  }

  const validRoles = ['admin', 'sales', 'fulfillment'];
  const newRole    = role && validRoles.includes(role) ? role : existing.role;
  const newActive  = active !== undefined ? (active ? 1 : 0) : existing.active;

  db.prepare(`
    UPDATE users SET name = ?, role = ?, active = ?, updated_at = datetime('now') WHERE id = ?
  `).run(name || existing.name, newRole, newActive, id);

  const updated = db.prepare(`
    SELECT id, email, name, role, avatar_url, active, created_at
    FROM users WHERE id = ?
  `).get(id);
  return res.json({ member: updated });
});

// ─── DELETE /api/settings/team/:id ───────────────────────────────────────────
router.delete('/settings/team/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Team member not found' });

  db.prepare("UPDATE users SET active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
  return res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/settings/api-keys
router.get('/api-keys', requireAdmin, (req, res) => {
  const keys = db.prepare(`
    SELECT id, name, service, created_at FROM api_keys ORDER BY created_at DESC
  `).all();
  return res.json({ keys });
});

// POST /api/settings/api-keys
router.post('/api-keys', requireAdmin, (req, res) => {
  const { name, service, value } = req.body;
  if (!name || !value) {
    return res.status(400).json({ error: 'name and value are required' });
  }

  const hash = bcrypt.hashSync(value, 10);
  const result = db.prepare(`
    INSERT INTO api_keys (name, key_hash, service)
    VALUES (?, ?, ?)
  `).run(name.trim(), hash, service || null);

  return res.status(201).json({
    key: { id: result.lastInsertRowid, name, service: service || null },
  });
});

// DELETE /api/settings/api-keys/:id
router.delete('/api-keys/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS (general key-value store)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/settings/general
router.get('/general', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return res.json({ settings });
});

// PUT /api/settings/general
router.put('/general', requireAdmin, (req, res) => {
  const entries = Object.entries(req.body);
  if (!entries.length) return res.status(400).json({ error: 'No settings provided' });

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const upsertMany = db.transaction((items) => {
    for (const [key, value] of items) {
      upsert.run(key, String(value));
    }
  });

  upsertMany(entries);
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const updated = {};
  rows.forEach(r => { updated[r.key] = r.value; });
  return res.json({ settings: updated });
});

// GET /api/settings/notifications
router.get('/notifications', requireAdmin, (req, res) => {
  const notifKeys = [
    'notify_new_lead',
    'notify_booked_call',
    'notify_closed_won',
    'notify_no_show',
  ];
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN (${notifKeys.map(() => '?').join(',')})`
  ).all(...notifKeys);

  const notifications = { notify_new_lead: '1', notify_booked_call: '1', notify_closed_won: '1', notify_no_show: '0' };
  rows.forEach(r => { notifications[r.key] = r.value; });
  return res.json({ notifications });
});

// PUT /api/settings/notifications
router.put('/notifications', requireAdmin, (req, res) => {
  const { notify_new_lead, notify_booked_call, notify_closed_won, notify_no_show } = req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const updates = [
    ['notify_new_lead',    notify_new_lead    !== undefined ? String(notify_new_lead)    : null],
    ['notify_booked_call', notify_booked_call !== undefined ? String(notify_booked_call) : null],
    ['notify_closed_won',  notify_closed_won  !== undefined ? String(notify_closed_won)  : null],
    ['notify_no_show',     notify_no_show     !== undefined ? String(notify_no_show)     : null],
  ].filter(([, v]) => v !== null);

  const tx = db.transaction((items) => {
    for (const [k, v] of items) upsert.run(k, v);
  });
  tx(updates);
  return res.json({ success: true });
});

// ─── GET /api/auth/me alias (used by dashboard) ───────────────────────────────
router.get('/me', (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
