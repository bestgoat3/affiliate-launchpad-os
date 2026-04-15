'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }                   = require('../middleware/auth');
const { requireRoles, requireStaff }     = require('../middleware/roles');

const router = express.Router();

// ─── Twilio client (lazy-init so missing creds only fail at call-time) ────────
function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  const twilio = require('twilio');
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function logLeadActivity(leadId, userId, activityType, description) {
  try {
    db.prepare(`
      INSERT INTO lead_activities (lead_id, user_id, activity_type, description)
      VALUES (?, ?, ?, ?)
    `).run(leadId, userId || null, activityType, description);
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

// ─── All dialer routes require authentication ─────────────────────────────────
router.use(authenticate);

// ─── POST /api/dialer/call ────────────────────────────────────────────────────
// Initiates an outbound call: Twilio calls Karl's Twilio number first,
// when Karl answers, Twilio then dials the lead's number and bridges them.
router.post('/call', requireStaff, async (req, res) => {
  const { lead_id, phone_number, notes } = req.body;

  if (!phone_number) {
    return res.status(400).json({ error: 'phone_number is required' });
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    return res.status(500).json({ error: 'TWILIO_PHONE_NUMBER is not configured' });
  }

  // Build the TwiML URL — must be publicly accessible (Railway URL in prod)
  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3001`;
  // Strip any trailing slash
  const twimlUrl = `${baseUrl.replace(/\/$/, '')}/api/dialer/twiml?to=${encodeURIComponent(phone_number)}`;

  let call;
  try {
    const client = getTwilioClient();

    // Twilio calls Karl's Twilio number (the FROM number acts as the caller ID).
    // When Karl picks up he hears the TwiML which then dials out to the lead.
    call = await client.calls.create({
      to:   fromNumber,   // Karl's registered Twilio phone — rings Karl first
      from: fromNumber,   // Caller ID shown to Karl
      url:  twimlUrl,     // TwiML instructions served by this server
      statusCallback: `${baseUrl.replace(/\/$/, '')}/api/dialer/status`,
      statusCallbackMethod: 'POST',
    });
  } catch (err) {
    console.error('Twilio call error:', err.message);
    return res.status(500).json({ error: `Twilio error: ${err.message}` });
  }

  // Log call in call_logs
  let callLogId = null;
  try {
    const result = db.prepare(`
      INSERT INTO call_logs
        (lead_id, user_id, direction, phone_number, disposition, notes, twilio_call_sid)
      VALUES (?, ?, 'outbound', ?, NULL, ?, ?)
    `).run(
      lead_id     || null,
      req.user.id,
      phone_number,
      notes       || null,
      call.sid
    );
    callLogId = result.lastInsertRowid;
  } catch (err) {
    console.error('Call log DB error:', err.message);
  }

  // Log to lead activity feed
  if (lead_id) {
    const lead = db.prepare('SELECT first_name, last_name FROM leads WHERE id = ?').get(parseInt(lead_id, 10));
    if (lead) {
      logLeadActivity(
        parseInt(lead_id, 10),
        req.user.id,
        'call_initiated',
        `Outbound call initiated to ${phone_number} by ${req.user.name}`
      );
    }
  }

  return res.json({
    success:       true,
    call_sid:      call.sid,
    status:        call.status,
    call_log_id:   callLogId,
    message:       `Call initiated. Your Twilio phone (${fromNumber}) will ring first — answer to connect to the lead.`,
  });
});

// ─── POST /api/dialer/twiml ───────────────────────────────────────────────────
// Returns TwiML that Twilio executes once Karl's phone answers.
// It then dials out to the lead's number and bridges the call.
router.post('/twiml', (req, res) => {
  const to = req.query.to || req.body.to || '';

  if (!to) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>No destination number provided.</Say></Response>`;
    res.type('text/xml').send(xml);
    return;
  }

  const sanitizedTo = to.trim();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to ${sanitizedTo}. Please hold.</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || ''}" timeout="30">
    <Number>${sanitizedTo}</Number>
  </Dial>
</Response>`;

  res.type('text/xml').send(xml);
});

// ─── POST /api/dialer/status ──────────────────────────────────────────────────
// Twilio status callback — updates the call_log with final status + duration.
router.post('/status', (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  if (CallSid) {
    const dispositionMap = {
      completed:   'answered',
      'no-answer': 'no-answer',
      busy:        'busy',
      failed:      'no-answer',
    };
    const disposition = dispositionMap[CallStatus] || null;
    const duration    = parseInt(CallDuration || '0', 10);

    try {
      db.prepare(`
        UPDATE call_logs
        SET disposition = ?, duration_seconds = ?
        WHERE twilio_call_sid = ?
      `).run(disposition, duration, CallSid);
    } catch (err) {
      console.error('Status callback DB error:', err.message);
    }
  }

  res.sendStatus(200);
});

// ─── POST /api/dialer/log ─────────────────────────────────────────────────────
// Manually log or update a call outcome after the fact.
router.post('/log', requireStaff, (req, res) => {
  const { call_log_id, lead_id, phone_number, duration_seconds, disposition, notes } = req.body;

  const validDispositions = ['answered', 'no-answer', 'voicemail', 'busy'];
  if (disposition && !validDispositions.includes(disposition)) {
    return res.status(400).json({ error: `disposition must be one of: ${validDispositions.join(', ')}` });
  }

  try {
    let logId = call_log_id;

    if (logId) {
      // Update existing call log
      const existing = db.prepare('SELECT * FROM call_logs WHERE id = ?').get(parseInt(logId, 10));
      if (!existing) return res.status(404).json({ error: 'Call log not found' });

      db.prepare(`
        UPDATE call_logs
        SET disposition = ?, duration_seconds = ?, notes = ?
        WHERE id = ?
      `).run(
        disposition      || existing.disposition,
        duration_seconds !== undefined ? parseInt(duration_seconds, 10) : existing.duration_seconds,
        notes            !== undefined ? notes : existing.notes,
        parseInt(logId, 10)
      );
    } else {
      // Create a new manual call log
      if (!phone_number) {
        return res.status(400).json({ error: 'phone_number is required when creating a new log' });
      }
      const result = db.prepare(`
        INSERT INTO call_logs
          (lead_id, user_id, direction, phone_number, duration_seconds, disposition, notes)
        VALUES (?, ?, 'outbound', ?, ?, ?, ?)
      `).run(
        lead_id          || null,
        req.user.id,
        phone_number,
        duration_seconds ? parseInt(duration_seconds, 10) : 0,
        disposition      || null,
        notes            || null
      );
      logId = result.lastInsertRowid;
    }

    // Log to lead activity feed
    const effectiveLeadId = lead_id || (call_log_id
      ? db.prepare('SELECT lead_id FROM call_logs WHERE id = ?').get(parseInt(call_log_id, 10))?.lead_id
      : null);

    if (effectiveLeadId) {
      const dispLabel = disposition || 'logged';
      logLeadActivity(
        parseInt(effectiveLeadId, 10),
        req.user.id,
        'call_logged',
        `Call ${dispLabel} — ${duration_seconds || 0}s — logged by ${req.user.name}${notes ? ': ' + notes : ''}`
      );
    }

    const log = db.prepare(`
      SELECT cl.*, l.first_name || ' ' || l.last_name AS lead_name
      FROM call_logs cl
      LEFT JOIN leads l ON l.id = cl.lead_id
      WHERE cl.id = ?
    `).get(parseInt(logId, 10));

    return res.json({ success: true, call_log: log });
  } catch (err) {
    console.error('Log call error:', err.message);
    return res.status(500).json({ error: 'Failed to log call' });
  }
});

// ─── GET /api/dialer/recent ───────────────────────────────────────────────────
// Returns the 20 most recent call logs with lead info.
router.get('/recent', requireStaff, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT
        cl.*,
        l.first_name || ' ' || l.last_name AS lead_name,
        l.phone AS lead_phone,
        u.name  AS caller_name
      FROM call_logs cl
      LEFT JOIN leads l ON l.id  = cl.lead_id
      LEFT JOIN users u ON u.id  = cl.user_id
      ORDER BY cl.called_at DESC
      LIMIT 20
    `).all();

    return res.json({ call_logs: logs });
  } catch (err) {
    console.error('Recent calls error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent calls' });
  }
});

// ─── GET /api/dialer/search-leads ────────────────────────────────────────────
// Quick lead search for the dialer UI (name or phone).
router.get('/search-leads', requireStaff, (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ leads: [] });
  }

  const pattern = `%${q.trim()}%`;
  try {
    const leads = db.prepare(`
      SELECT id, first_name, last_name, phone, email, stage
      FROM leads
      WHERE
        first_name LIKE ?
        OR last_name  LIKE ?
        OR phone      LIKE ?
        OR (first_name || ' ' || last_name) LIKE ?
      ORDER BY updated_at DESC
      LIMIT 10
    `).all(pattern, pattern, pattern, pattern);

    return res.json({ leads });
  } catch (err) {
    console.error('Lead search error:', err.message);
    return res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
