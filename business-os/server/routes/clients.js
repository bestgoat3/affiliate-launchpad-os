'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }   = require('../middleware/auth');
const { requireRoles, requireAdmin } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getClientFull(clientId) {
  const client = db.prepare(`
    SELECT
      c.*,
      l.first_name, l.last_name, l.email AS lead_email, l.phone,
      l.source, l.monthly_revenue, l.budget, l.goal_90_days,
      u.name  AS portal_user_name,
      u.email AS portal_user_email,
      fu.name AS fulfillment_name
    FROM clients c
    LEFT JOIN leads l  ON l.id = c.lead_id
    LEFT JOIN users u  ON u.id = c.user_id
    LEFT JOIN users fu ON fu.id = c.assigned_fulfillment_id
    WHERE c.id = ?
  `).get(clientId);

  if (!client) return null;

  client.checklist = db.prepare(
    'SELECT * FROM onboarding_checklist WHERE client_id = ? ORDER BY id ASC'
  ).all(clientId);

  client.deliverables = db.prepare(
    'SELECT * FROM deliverables WHERE client_id = ? ORDER BY id ASC'
  ).all(clientId);

  return client;
}

// ─── GET /api/clients  (admin / fulfillment) ──────────────────────────────────
router.get('/', requireRoles('admin', 'fulfillment'), (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT
      c.*,
      l.first_name, l.last_name, l.email AS lead_email,
      u.name AS portal_user_name,
      fu.name AS fulfillment_name,
      (SELECT COUNT(*) FROM onboarding_checklist WHERE client_id = c.id AND completed = 1) AS tasks_done,
      (SELECT COUNT(*) FROM onboarding_checklist WHERE client_id = c.id) AS tasks_total
    FROM clients c
    LEFT JOIN leads l  ON l.id = c.lead_id
    LEFT JOIN users u  ON u.id = c.user_id
    LEFT JOIN users fu ON fu.id = c.assigned_fulfillment_id
    WHERE 1=1
  `;
  const params = [];

  const validStatuses = ['Onboarding', 'Active', 'Completed'];
  if (status && validStatuses.includes(status)) {
    query += ' AND c.status = ?';
    params.push(status);
  }

  // Fulfillment users only see their assigned clients
  if (req.user.role === 'fulfillment') {
    query += ' AND c.assigned_fulfillment_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const clients = db.prepare(query).all(...params);
  return res.json({ clients });
});

// ─── GET /api/clients/me  (client role only) ──────────────────────────────────
router.get('/me', (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'This endpoint is for client accounts only' });
  }

  const client = db.prepare(`
    SELECT c.*,
           l.first_name, l.last_name, l.email AS lead_email, l.phone,
           l.monthly_revenue, l.budget, l.goal_90_days
    FROM clients c
    LEFT JOIN leads l ON l.id = c.lead_id
    WHERE c.user_id = ?
    LIMIT 1
  `).get(req.user.id);

  if (!client) {
    return res.status(404).json({ error: 'No client profile found for this account' });
  }

  client.checklist = db.prepare(
    'SELECT * FROM onboarding_checklist WHERE client_id = ? ORDER BY id ASC'
  ).all(client.id);

  client.deliverables = db.prepare(
    'SELECT * FROM deliverables WHERE client_id = ? ORDER BY id ASC'
  ).all(client.id);

  // Clients only see visible resources
  const resources = db.prepare(
    'SELECT * FROM resources WHERE visible_to_clients = 1 ORDER BY created_at DESC'
  ).all();

  return res.json({ client, resources });
});

// ─── GET /api/clients/:id  (admin / fulfillment) ──────────────────────────────
router.get('/:id', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const client   = getClientFull(clientId);

  if (!client) return res.status(404).json({ error: 'Client not found' });

  // Fulfillment users only see their assigned clients
  if (req.user.role === 'fulfillment' && client.assigned_fulfillment_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  return res.json({ client });
});

// ─── PUT /api/clients/:id ─────────────────────────────────────────────────────
router.put('/:id', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
  if (!existing) return res.status(404).json({ error: 'Client not found' });

  if (req.user.role === 'fulfillment' && existing.assigned_fulfillment_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const {
    status, notes, onboarding_started_at, active_since,
    assigned_fulfillment_id, user_id,
  } = req.body;

  const validStatuses = ['Onboarding', 'Active', 'Completed'];

  db.prepare(`
    UPDATE clients SET
      status                  = ?,
      notes                   = ?,
      onboarding_started_at   = ?,
      active_since            = ?,
      assigned_fulfillment_id = ?,
      user_id                 = ?
    WHERE id = ?
  `).run(
    status && validStatuses.includes(status) ? status : existing.status,
    notes                   !== undefined ? notes                   : existing.notes,
    onboarding_started_at   !== undefined ? onboarding_started_at  : existing.onboarding_started_at,
    active_since            !== undefined ? active_since            : existing.active_since,
    assigned_fulfillment_id !== undefined ? assigned_fulfillment_id: existing.assigned_fulfillment_id,
    user_id                 !== undefined ? user_id                : existing.user_id,
    clientId
  );

  const updated = getClientFull(clientId);
  return res.json({ client: updated });
});

// ─── POST /api/clients/:id/checklist ─────────────────────────────────────────
router.post('/:id/checklist', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const client   = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const { task_name, due_date } = req.body;
  if (!task_name) return res.status(400).json({ error: 'task_name is required' });

  const result = db.prepare(`
    INSERT INTO onboarding_checklist (client_id, task_name, due_date)
    VALUES (?, ?, ?)
  `).run(clientId, task_name.trim(), due_date || null);

  const item = db.prepare('SELECT * FROM onboarding_checklist WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ item });
});

// ─── PUT /api/clients/:id/checklist/:itemId ───────────────────────────────────
router.put('/:id/checklist/:itemId', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const itemId   = parseInt(req.params.itemId, 10);

  const item = db.prepare(
    'SELECT * FROM onboarding_checklist WHERE id = ? AND client_id = ?'
  ).get(itemId, clientId);

  if (!item) return res.status(404).json({ error: 'Checklist item not found' });

  const { completed, task_name, due_date } = req.body;
  const isCompleted = completed === true || completed === 1;

  db.prepare(`
    UPDATE onboarding_checklist SET
      task_name    = ?,
      completed    = ?,
      completed_at = ?,
      due_date     = ?
    WHERE id = ?
  `).run(
    task_name  !== undefined ? task_name.trim()                : item.task_name,
    isCompleted ? 1 : 0,
    isCompleted && !item.completed ? new Date().toISOString()  : item.completed_at,
    due_date   !== undefined ? due_date                        : item.due_date,
    itemId
  );

  const updated = db.prepare('SELECT * FROM onboarding_checklist WHERE id = ?').get(itemId);
  return res.json({ item: updated });
});

// ─── POST /api/clients/:id/deliverables ──────────────────────────────────────
router.post('/:id/deliverables', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const client   = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const { name, status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const validStatuses = ['pending', 'sent', 'completed'];
  const delStatus = status && validStatuses.includes(status) ? status : 'pending';

  const result = db.prepare(`
    INSERT INTO deliverables (client_id, name, status, notes)
    VALUES (?, ?, ?, ?)
  `).run(clientId, name.trim(), delStatus, notes || null);

  const deliverable = db.prepare('SELECT * FROM deliverables WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ deliverable });
});

// ─── PUT /api/clients/:id/deliverables/:delId ─────────────────────────────────
router.put('/:id/deliverables/:delId', requireRoles('admin', 'fulfillment'), (req, res) => {
  const clientId = parseInt(req.params.id, 10);
  const delId    = parseInt(req.params.delId, 10);

  const deliverable = db.prepare(
    'SELECT * FROM deliverables WHERE id = ? AND client_id = ?'
  ).get(delId, clientId);

  if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

  const { name, status, notes } = req.body;
  const validStatuses = ['pending', 'sent', 'completed'];
  const newStatus = status && validStatuses.includes(status) ? status : deliverable.status;

  // Auto-stamp sent_at when status moves to 'sent'
  let sentAt = deliverable.sent_at;
  if (newStatus === 'sent' && deliverable.status !== 'sent') {
    sentAt = new Date().toISOString();
  }

  db.prepare(`
    UPDATE deliverables SET
      name    = ?,
      status  = ?,
      sent_at = ?,
      notes   = ?
    WHERE id = ?
  `).run(
    name   ? name.trim()  : deliverable.name,
    newStatus,
    sentAt,
    notes  !== undefined  ? notes : deliverable.notes,
    delId
  );

  const updated = db.prepare('SELECT * FROM deliverables WHERE id = ?').get(delId);
  return res.json({ deliverable: updated });
});

module.exports = router;
