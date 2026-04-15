'use strict';

/**
 * Webhooks Router
 *
 * Handles miscellaneous webhook endpoints beyond the inbound GHL lead route
 * (which lives in leads.js at POST /api/leads/inbound).
 *
 * Routes here:
 *  POST /api/webhooks/calendly  — Calendly booking webhook
 *  POST /api/webhooks/youform   — YouForm submission webhook (alternative to redirect)
 *  GET  /api/webhooks/test      — Verify webhook endpoint is reachable
 */

const express = require('express');
const { db }  = require('../db/database');
const { notifyNewLead } = require('../utils/notifications');

const router = express.Router();

// ─── Stage Automations Helper ─────────────────────────────────────────────────
/**
 * runStageAutomations(leadId, newStage, db)
 * Call this whenever a lead's stage changes.
 * Exported so leads.js can import and use it too.
 */
function runStageAutomations(leadId, newStage, dbInstance) {
  const d = dbInstance || db;
  try {
    if (newStage === 'Closed Won') {
      // Insert into clients if not already there
      const existing = d.prepare('SELECT id FROM clients WHERE lead_id = ?').get(leadId);
      if (!existing) {
        d.prepare(`
          INSERT INTO clients (lead_id, status, onboarding_started_at)
          VALUES (?, 'Onboarding', datetime('now'))
        `).run(leadId);
        d.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, NULL, 'client_created', 'Client record created automatically on Closed Won')
        `).run(leadId);
      }
    } else if (newStage === 'Proposal Sent') {
      d.prepare(`
        INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
        VALUES (?, NULL, 'proposal_sent', ?)
      `).run(leadId, `Proposal sent at ${new Date().toISOString()}`);
    } else if (newStage === 'Churned Lost') {
      d.prepare(`
        INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
        VALUES (?, NULL, 'churned', 'Lead marked as Churned/Lost')
      `).run(leadId);
    }
  } catch (err) {
    console.error('[runStageAutomations] Error for lead', leadId, ':', err.message);
  }
}

// ─── Webhook Secret Validation Helper ────────────────────────────────────────
function validateSecret(req, res, secretEnvKey) {
  const provided = req.headers['x-webhook-secret']
    || req.headers['x-hub-signature-256']
    || req.query.secret;
  const expected = process.env[secretEnvKey];

  if (!expected) {
    // If no secret configured, log a warning but allow through in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WEBHOOK] ${secretEnvKey} not set — accepting without validation`);
      return true;
    }
    res.status(500).json({ error: 'Webhook secret not configured' });
    return false;
  }

  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid webhook secret' });
    return false;
  }
  return true;
}

// ─── GET /api/webhooks/test ───────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Affiliate Launchpad webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/webhooks/calendly ─────────────────────────────────────────────
// Called by Calendly when a new booking is made.
// Finds or creates a lead, sets stage to "Booked Call", logs call date.
router.post('/calendly', (req, res) => {
  const { event, payload } = req.body;
  if (!event || !payload) {
    return res.status(400).json({ error: 'Invalid Calendly payload' });
  }

  console.log('[Calendly Webhook]', event, payload?.email);

  if (event === 'invitee.created') {
    const email      = payload?.email;
    const callTime   = payload?.scheduled_event?.start_time || null;
    const fullName   = payload?.name || '';
    const nameParts  = fullName.trim().split(/\s+/);
    const firstName  = nameParts[0] || '';
    const lastName   = nameParts.slice(1).join(' ') || '';

    if (email) {
      const lead = db.prepare('SELECT * FROM leads WHERE email = ?').get(email.toLowerCase());

      if (lead) {
        // Update existing lead to Booked Call
        db.prepare(`
          UPDATE leads
          SET stage = 'Booked Call', call_date = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(callTime, lead.id);

        db.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, NULL, 'call_booked', ?)
        `).run(lead.id, `Call booked via Calendly for ${callTime || 'unknown time'}`);

        runStageAutomations(lead.id, 'Booked Call');
        console.log(`[Calendly] Lead ${lead.id} (${email}) moved to Booked Call`);
      } else {
        // Create new lead
        const result = db.prepare(`
          INSERT INTO leads
            (first_name, last_name, email, source, stage, call_date, lead_score, tags)
          VALUES (?, ?, ?, 'Calendly', 'Booked Call', ?, 0, '[]')
        `).run(firstName, lastName, email.toLowerCase(), callTime);

        db.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, NULL, 'lead_created', 'Lead created from Calendly booking')
        `).run(result.lastInsertRowid);

        db.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, NULL, 'call_booked', ?)
        `).run(result.lastInsertRowid, `Call booked via Calendly for ${callTime || 'unknown time'}`);

        runStageAutomations(result.lastInsertRowid, 'Booked Call');
        console.log(`[Calendly] New lead created for ${email} with Booked Call`);
      }
    }
  }

  if (event === 'invitee.canceled') {
    const email = payload?.email;
    if (email) {
      const lead = db.prepare('SELECT * FROM leads WHERE email = ?').get(email.toLowerCase());
      if (lead) {
        db.prepare(`
          INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
          VALUES (?, NULL, 'call_cancelled', 'Calendly booking was cancelled')
        `).run(lead.id);
      }
    }
  }

  return res.json({ success: true });
});

// ─── POST /api/webhooks/youform ───────────────────────────────────────────────
// Called directly from YouForm's webhook feature.
// Maps form fields, scores the lead, and creates a new lead record.
router.post('/youform', (req, res) => {
  if (!validateSecret(req, res, 'YOUFORM_WEBHOOK_SECRET')) return;

  const {
    first_name, last_name, email, phone,
    monthly_revenue, budget, goal_90_days, investment_ready,
    // YouForm may send camelCase — handle both
    firstName, lastName,
    // Legacy field name fallbacks
    monthly_income,
  } = req.body;

  const fName = (first_name || firstName || '').trim();
  const lName = (last_name  || lastName  || '').trim();
  const rev   = monthly_revenue || monthly_income || null;

  if (!fName && !email) {
    return res.status(400).json({ error: 'At minimum first_name or email required' });
  }

  // ── Lead scoring ──────────────────────────────────────────────
  let score = 0;
  if (investment_ready === 'Yes') score += 30;
  if (phone) score += 10;
  // Parse revenue/budget values — strip "$", "k", commas, etc.
  function parseMoney(val) {
    if (!val) return 0;
    const n = parseFloat(String(val).replace(/[$,k]/gi, (m) => m.toLowerCase() === 'k' ? '000' : ''));
    return isNaN(n) ? 0 : n;
  }
  if (parseMoney(rev) > 5000)    score += 20;
  if (parseMoney(budget) > 2000) score += 20;
  score = Math.min(score, 100);

  try {
    const result = db.prepare(`
      INSERT INTO leads
        (first_name, last_name, email, phone, source,
         monthly_revenue, budget, goal_90_days, investment_ready,
         stage, lead_score, tags)
      VALUES (?, ?, ?, ?, 'YouForm', ?, ?, ?, ?, 'New Lead', ?, '[]')
    `).run(
      fName,
      lName,
      email            || null,
      phone            || null,
      rev,
      budget           || null,
      goal_90_days     || null,
      investment_ready || null,
      score
    );

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);

    db.prepare(`
      INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
      VALUES (?, NULL, 'lead_created', 'Lead submitted via YouForm')
    `).run(lead.id);

    notifyNewLead(lead).catch(console.error);

    return res.status(201).json({ success: true, lead_id: lead.id });
  } catch (err) {
    console.error('[YouForm webhook error]', err);
    return res.status(500).json({ error: 'Failed to process YouForm submission' });
  }
});

module.exports = router;
module.exports.runStageAutomations = runStageAutomations;
