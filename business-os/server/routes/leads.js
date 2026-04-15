'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }              = require('../middleware/auth');
const { requireRoles, requireAdmin, requireStaff } = require('../middleware/roles');
const { fireClosedWonWebhook }      = require('../utils/ghl');
const { notifyNewLead, notifyClosedWon } = require('../utils/notifications');
const { runStageAutomations }        = require('./webhooks');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

function serializeTags(tags) {
  if (!tags) return '[]';
  if (typeof tags === 'string') return tags;
  return JSON.stringify(tags);
}

function logActivity(leadId, userId, activityType, description) {
  try {
    db.prepare(`
      INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
      VALUES (?, ?, ?, ?)
    `).run(leadId, userId || null, activityType, description);
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// ─── POST /api/leads/inbound  (GHL Webhook — no auth) ────────────────────────
router.post('/inbound', (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.GHL_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  const {
    firstName, lastName, email, phone, source,
    customFields = {}, tags = [],
  } = req.body;

  if (!firstName) {
    return res.status(400).json({ error: 'firstName is required' });
  }

  const {
    monthly_revenue, budget, goal_90_days, investment_ready,
  } = customFields;

  try {
    const result = db.prepare(`
      INSERT INTO leads
        (first_name, last_name, email, phone, source,
         monthly_revenue, budget, goal_90_days, investment_ready,
         stage, lead_score, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead', 0, ?)
    `).run(
      firstName.trim(),
      (lastName || '').trim(),
      email   || null,
      phone   || null,
      source  || 'GHL Webhook',
      monthly_revenue  || null,
      budget           || null,
      goal_90_days     || null,
      investment_ready || null,
      serializeTags(tags)
    );

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    logActivity(lead.id, null, 'webhook_inbound', 'Lead received via GHL inbound webhook');

    // Fire-and-forget notifications
    notifyNewLead(lead).catch(console.error);

    return res.status(201).json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error('Inbound webhook error:', err);
    return res.status(500).json({ error: 'Failed to process inbound lead' });
  }
});

// All routes below require authentication
router.use(authenticate);

// ─── GET /api/leads ───────────────────────────────────────────────────────────
router.get('/', requireStaff, (req, res) => {
  const { stage, search, source, assigned_rep_id, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT l.*,
           u.name AS rep_name
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_rep_id
    WHERE 1=1
  `;
  const params = [];

  if (stage) {
    query += ' AND l.stage = ?';
    params.push(stage);
  }
  if (source) {
    query += ' AND l.source = ?';
    params.push(source);
  }
  if (assigned_rep_id) {
    query += ' AND l.assigned_rep_id = ?';
    params.push(parseInt(assigned_rep_id, 10));
  }
  if (search) {
    query += ` AND (
      l.first_name LIKE ? OR l.last_name LIKE ?
      OR l.email LIKE ? OR l.phone LIKE ?
    )`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  // Sales reps only see their own leads
  if (req.user.role === 'sales') {
    query += ' AND l.assigned_rep_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const leads = db.prepare(query).all(...params);
  const countQuery = query.replace(/SELECT l\.\*.*?FROM leads l/, 'SELECT COUNT(*) as total FROM leads l');
  // Simple count
  let total = leads.length;
  try {
    const countParams = params.slice(0, -2); // remove limit/offset
    const countSql = `
      SELECT COUNT(*) as total FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_rep_id
      WHERE 1=1
      ${stage             ? 'AND l.stage = ?'            : ''}
      ${source            ? 'AND l.source = ?'           : ''}
      ${assigned_rep_id   ? 'AND l.assigned_rep_id = ?'  : ''}
      ${search            ? 'AND (l.first_name LIKE ? OR l.last_name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)' : ''}
      ${req.user.role === 'sales' ? 'AND l.assigned_rep_id = ?' : ''}
    `;
    total = db.prepare(countSql).get(...countParams).total;
  } catch (_) { /* use leads.length */ }

  return res.json({
    leads: leads.map(l => ({ ...l, tags: parseTags(l.tags) })),
    total,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
});

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────
router.get('/:id', requireStaff, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const lead = db.prepare(`
    SELECT l.*, u.name AS rep_name
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_rep_id
    WHERE l.id = ?
  `).get(id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  // Sales reps only see their assigned leads
  if (req.user.role === 'sales' && lead.assigned_rep_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const notes = db.prepare(`
    SELECT n.*, u.name AS author_name
    FROM lead_notes n
    LEFT JOIN users u ON u.id = n.user_id
    WHERE n.lead_id = ?
    ORDER BY n.created_at DESC
  `).all(id);

  const activities = db.prepare(`
    SELECT a.*, u.name AS actor_name
    FROM lead_activities a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.lead_id = ?
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all(id);

  return res.json({
    lead:       { ...lead, tags: parseTags(lead.tags) },
    notes,
    activities,
  });
});

// ─── POST /api/leads ──────────────────────────────────────────────────────────
router.post('/', requireStaff, (req, res) => {
  const {
    first_name, last_name, email, phone, source,
    monthly_revenue, budget, goal_90_days, investment_ready,
    stage, lead_score, assigned_rep_id, call_date, notes, tags,
  } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'first_name is required' });
  }

  const validStages = [
    'New Lead','Booked Call','Call Completed','Proposal Sent',
    'Closed Won','Onboarding','Active Client','Upsell Opportunity','Churned Lost',
  ];
  const leadStage = stage && validStages.includes(stage) ? stage : 'New Lead';

  try {
    const result = db.prepare(`
      INSERT INTO leads
        (first_name, last_name, email, phone, source,
         monthly_revenue, budget, goal_90_days, investment_ready,
         stage, lead_score, assigned_rep_id, call_date, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      first_name.trim(),
      (last_name || '').trim(),
      email           || null,
      phone           || null,
      source          || null,
      monthly_revenue || null,
      budget          || null,
      goal_90_days    || null,
      investment_ready|| null,
      leadStage,
      lead_score      || 0,
      assigned_rep_id || null,
      call_date       || null,
      notes           || null,
      serializeTags(tags)
    );

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
    logActivity(lead.id, req.user.id, 'lead_created', `Lead created by ${req.user.name}`);

    return res.status(201).json({ lead: { ...lead, tags: parseTags(lead.tags) } });
  } catch (err) {
    console.error('Create lead error:', err);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
});

// ─── PUT /api/leads/:id ───────────────────────────────────────────────────────
router.put('/:id', requireStaff, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Lead not found' });

  // Sales reps can only edit their own leads
  if (req.user.role === 'sales' && existing.assigned_rep_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const {
    first_name, last_name, email, phone, source,
    monthly_revenue, budget, goal_90_days, investment_ready,
    stage, lead_score, assigned_rep_id, call_date, notes, tags,
  } = req.body;

  const validStages = [
    'New Lead','Booked Call','Call Completed','Proposal Sent',
    'Closed Won','Onboarding','Active Client','Upsell Opportunity','Churned Lost',
  ];

  const newStage = stage && validStages.includes(stage) ? stage : existing.stage;
  const stageChanged = newStage !== existing.stage;

  db.prepare(`
    UPDATE leads SET
      first_name        = ?,
      last_name         = ?,
      email             = ?,
      phone             = ?,
      source            = ?,
      monthly_revenue   = ?,
      budget            = ?,
      goal_90_days      = ?,
      investment_ready  = ?,
      stage             = ?,
      lead_score        = ?,
      assigned_rep_id   = ?,
      call_date         = ?,
      notes             = ?,
      tags              = ?,
      updated_at        = datetime('now')
    WHERE id = ?
  `).run(
    first_name        || existing.first_name,
    last_name         !== undefined ? last_name         : existing.last_name,
    email             !== undefined ? email             : existing.email,
    phone             !== undefined ? phone             : existing.phone,
    source            !== undefined ? source            : existing.source,
    monthly_revenue   !== undefined ? monthly_revenue   : existing.monthly_revenue,
    budget            !== undefined ? budget            : existing.budget,
    goal_90_days      !== undefined ? goal_90_days      : existing.goal_90_days,
    investment_ready  !== undefined ? investment_ready  : existing.investment_ready,
    newStage,
    lead_score        !== undefined ? lead_score        : existing.lead_score,
    assigned_rep_id   !== undefined ? assigned_rep_id   : existing.assigned_rep_id,
    call_date         !== undefined ? call_date         : existing.call_date,
    notes             !== undefined ? notes             : existing.notes,
    tags              !== undefined ? serializeTags(tags) : existing.tags,
    id
  );

  if (stageChanged) {
    logActivity(id, req.user.id, 'stage_change',
      `Stage changed from "${existing.stage}" to "${newStage}" by ${req.user.name}`);

    // Run stage automations (client creation, proposal log, churn log)
    runStageAutomations(id, newStage, db);

    // Trigger GHL outbound webhook on Closed Won
    if (newStage === 'Closed Won') {
      const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
      const rep = updatedLead.assigned_rep_id
        ? db.prepare('SELECT name FROM users WHERE id = ?').get(updatedLead.assigned_rep_id)
        : null;

      // Fire-and-forget
      fireClosedWonWebhook(updatedLead, rep ? rep.name : '').catch(console.error);
      notifyClosedWon(updatedLead, rep ? rep.name : '').catch(console.error);
    }
  } else {
    logActivity(id, req.user.id, 'lead_updated', `Lead updated by ${req.user.name}`);
  }

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return res.json({ lead: { ...updated, tags: parseTags(updated.tags) } });
});

// ─── DELETE /api/leads/:id  (admin only) ──────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM leads WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Lead not found' });

  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ─── POST /api/leads/:id/notes ────────────────────────────────────────────────
router.post('/:id/notes', requireStaff, (req, res) => {
  const leadId = parseInt(req.params.id, 10);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const result = db.prepare(`
    INSERT INTO lead_notes (lead_id, user_id, content)
    VALUES (?, ?, ?)
  `).run(leadId, req.user.id, content.trim());

  logActivity(leadId, req.user.id, 'note_added', `Note added by ${req.user.name}`);

  const note = db.prepare(`
    SELECT n.*, u.name AS author_name
    FROM lead_notes n
    LEFT JOIN users u ON u.id = n.user_id
    WHERE n.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json({ note });
});

// ─── POST /api/leads/:id/move ─────────────────────────────────────────────────
router.post('/:id/move', requireStaff, (req, res) => {
  const leadId = parseInt(req.params.id, 10);
  const { stage } = req.body;

  const validStages = [
    'New Lead','Booked Call','Call Completed','Proposal Sent',
    'Closed Won','Onboarding','Active Client','Upsell Opportunity','Churned Lost',
  ];

  if (!stage || !validStages.includes(stage)) {
    return res.status(400).json({ error: 'Valid stage is required', validStages });
  }

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (req.user.role === 'sales' && lead.assigned_rep_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const previousStage = lead.stage;
  db.prepare(`
    UPDATE leads SET stage = ?, updated_at = datetime('now') WHERE id = ?
  `).run(stage, leadId);

  logActivity(leadId, req.user.id, 'stage_change',
    `Moved from "${previousStage}" to "${stage}" by ${req.user.name}`);

  // Run stage automations (client creation, proposal log, churn log)
  runStageAutomations(leadId, stage, db);

  if (stage === 'Closed Won' && previousStage !== 'Closed Won') {
    const updatedLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    const rep = updatedLead.assigned_rep_id
      ? db.prepare('SELECT name FROM users WHERE id = ?').get(updatedLead.assigned_rep_id)
      : null;
    fireClosedWonWebhook(updatedLead, rep ? rep.name : '').catch(console.error);
    notifyClosedWon(updatedLead, rep ? rep.name : '').catch(console.error);
  }

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  return res.json({ lead: { ...updated, tags: parseTags(updated.tags) } });
});

module.exports = router;
