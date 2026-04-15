'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireStaff } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate, requireStaff);

// ─── GET /api/sales/metrics ───────────────────────────────────────────────────
// Returns leads_in, calls_booked, shows, closes, revenue, avg_deal_size
// for today, this week, and this month
router.get('/metrics', (req, res) => {
  const isSalesRep  = req.user.role === 'sales';
  const repFilter   = isSalesRep ? `AND l.assigned_rep_id = ${req.user.id}` : '';

  function getMetrics(interval) {
    const leads_in = db.prepare(`
      SELECT COUNT(*) as c FROM leads l
      WHERE l.created_at >= datetime('now', ?)
      ${repFilter}
    `).get(interval).c;

    const calls_booked = db.prepare(`
      SELECT COUNT(*) as c FROM leads l
      WHERE l.stage IN ('Booked Call','Call Completed')
      AND l.updated_at >= datetime('now', ?)
      ${repFilter}
    `).get(interval).c;

    const shows = db.prepare(`
      SELECT COUNT(*) as c FROM leads l
      WHERE l.stage = 'Call Completed'
      AND l.updated_at >= datetime('now', ?)
      ${repFilter}
    `).get(interval).c;

    const closes = db.prepare(`
      SELECT COUNT(*) as c FROM leads l
      WHERE l.stage = 'Closed Won'
      AND l.updated_at >= datetime('now', ?)
      ${repFilter}
    `).get(interval).c;

    return { leads_in, calls_booked, shows, closes };
  }

  const daily   = getMetrics('-1 day');
  const weekly  = getMetrics('-7 days');
  const monthly = getMetrics('-30 days');

  return res.json({ daily, weekly, monthly });
});

// ─── GET /api/sales/dashboard  (full sales dashboard data) ───────────────────
// Also served at GET /api/dashboard/dashboard
router.get('/dashboard', (req, res) => {
  const { period = 'This Month' } = req.query;

  const intervalMap = {
    'Today':      '-1 day',
    'This Week':  '-7 days',
    'This Month': '-30 days',
    'Last Month': '-60 days',
  };
  const interval = intervalMap[period] || '-30 days';
  const isSalesRep = req.user.role === 'sales';
  const repFilter  = isSalesRep ? `AND l.assigned_rep_id = ${req.user.id}` : '';

  const q = (sql, params = []) => db.prepare(sql).get(...params);

  const leads_in     = q(`SELECT COUNT(*) c FROM leads l WHERE l.created_at >= datetime('now',?) ${repFilter}`, [interval]).c;
  const calls_booked = q(`SELECT COUNT(*) c FROM leads l WHERE l.stage IN ('Booked Call','Call Completed') AND l.updated_at >= datetime('now',?) ${repFilter}`, [interval]).c;
  const shows        = q(`SELECT COUNT(*) c FROM leads l WHERE l.stage='Call Completed' AND l.updated_at >= datetime('now',?) ${repFilter}`, [interval]).c;
  const closes       = q(`SELECT COUNT(*) c FROM leads l WHERE l.stage='Closed Won' AND l.updated_at >= datetime('now',?) ${repFilter}`, [interval]).c;

  const show_rate  = calls_booked > 0 ? Math.round((shows  / calls_booked) * 100) : 0;
  const close_rate = leads_in     > 0 ? Math.round((closes / leads_in)     * 100) : 0;
  const avg_deal_size = 3000; // placeholder — replace with real deal value tracking

  // Daily chart: last 14 days
  const chartRows = db.prepare(`
    SELECT date(created_at) AS date, COUNT(*) AS leads
    FROM leads l
    WHERE l.created_at >= datetime('now', '-14 days') ${repFilter}
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all();

  const closedRows = db.prepare(`
    SELECT date(updated_at) AS date, COUNT(*) AS closes
    FROM leads l
    WHERE l.stage='Closed Won' AND l.updated_at >= datetime('now','-14 days') ${repFilter}
    GROUP BY date(updated_at)
    ORDER BY date ASC
  `).all();

  // Merge chart data
  const chartMap = {};
  chartRows.forEach(r  => { chartMap[r.date]  = { date: r.date, leads: r.leads, closes: 0 }; });
  closedRows.forEach(r => {
    if (chartMap[r.date]) chartMap[r.date].closes = r.closes;
    else chartMap[r.date] = { date: r.date, leads: 0, closes: r.closes };
  });
  const chart = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

  // Pipeline value
  const pipeline_value = db.prepare(`
    SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage ORDER BY created_at
  `).all().map(r => ({ stage: r.stage, value: r.count * avg_deal_size, count: r.count }));

  return res.json({
    metrics: { leads_in, calls_booked, show_rate, close_rate, revenue_closed: closes * avg_deal_size, avg_deal_size },
    chart,
    pipeline_value,
    period,
  });
});

// ─── GET /api/dashboard/stats  (compact stats for overview dashboard) ─────────
router.get('/stats', (req, res) => {
  const isSalesRep = req.user.role === 'sales';
  const repFilter  = isSalesRep ? `AND assigned_rep_id = ${req.user.id}` : '';

  const leads_this_month = db.prepare(`SELECT COUNT(*) c FROM leads WHERE created_at >= datetime('now','-30 days') ${repFilter}`).get().c;
  const leads_last_month = db.prepare(`SELECT COUNT(*) c FROM leads WHERE created_at BETWEEN datetime('now','-60 days') AND datetime('now','-30 days') ${repFilter}`).get().c;
  const calls_booked     = db.prepare(`SELECT COUNT(*) c FROM leads WHERE stage='Booked Call' ${repFilter}`).get().c;
  const closes           = db.prepare(`SELECT COUNT(*) c FROM leads WHERE stage='Closed Won' AND updated_at >= datetime('now','-30 days') ${repFilter}`).get().c;
  const close_rate       = leads_this_month > 0 ? Math.round((closes / leads_this_month) * 100) : 0;
  const avg_deal         = 3000;

  return res.json({
    metrics: {
      leads_this_month,
      leads_change: leads_last_month > 0 ? Math.round(((leads_this_month - leads_last_month) / leads_last_month) * 100) : null,
      calls_booked,
      close_rate,
      revenue_closed: closes * avg_deal,
    },
  });
});

// ─── GET /api/dashboard/upcoming-calls ───────────────────────────────────────
router.get('/upcoming-calls', (req, res) => {
  const isSalesRep = req.user.role === 'sales';
  const leads = db.prepare(`
    SELECT id, first_name, last_name, email, phone, call_date, stage, lead_score
    FROM leads
    WHERE call_date >= datetime('now')
    ${isSalesRep ? `AND assigned_rep_id = ${req.user.id}` : ''}
    ORDER BY call_date ASC
    LIMIT 10
  `).all();
  return res.json({ leads });
});

// ─── GET /api/dashboard/pipeline-overview ────────────────────────────────────
router.get('/pipeline-overview', (req, res) => {
  const stages = db.prepare(`
    SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage
  `).all();
  return res.json({ stages });
});

// ─── GET /api/sales/leaderboard ───────────────────────────────────────────────
router.get('/leaderboard', (req, res) => {
  const { period = 'This Month' } = req.query;
  const intervalMap = { 'Today': '-1 day', 'This Week': '-7 days', 'This Month': '-30 days', 'Last Month': '-60 days' };
  const interval = intervalMap[period] || `-${parseInt(period, 10) || 30} days`;

  const leaderboard = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.avatar_url,
      COUNT(l.id) AS total_leads,
      SUM(CASE WHEN l.stage = 'Closed Won' THEN 1 ELSE 0 END) AS closes,
      SUM(CASE WHEN l.stage = 'Booked Call' THEN 1 ELSE 0 END) AS calls_booked,
      SUM(CASE WHEN l.stage = 'Call Completed' THEN 1 ELSE 0 END) AS calls_completed,
      ROUND(
        CAST(SUM(CASE WHEN l.stage = 'Closed Won' THEN 1 ELSE 0 END) AS REAL)
        / NULLIF(COUNT(l.id), 0) * 100, 1
      ) AS close_rate
    FROM users u
    LEFT JOIN leads l ON l.assigned_rep_id = u.id
      AND l.created_at >= datetime('now', ?)
    WHERE u.role IN ('admin','sales')
    AND u.active = 1
    GROUP BY u.id
    ORDER BY closes DESC, total_leads DESC
  `).all(interval);

  return res.json({ leaderboard, period: parseInt(period, 10) });
});

// ─── GET /api/sales/pipeline-value ───────────────────────────────────────────
router.get('/pipeline-value', (req, res) => {
  const stages = db.prepare(`
    SELECT
      ps.name AS stage,
      ps.color,
      ps.order_index,
      COUNT(l.id) AS lead_count
    FROM pipeline_stages ps
    LEFT JOIN leads l ON l.stage = ps.name
    GROUP BY ps.id
    ORDER BY ps.order_index ASC
  `).all();

  return res.json({ stages });
});

// ─── GET /api/sales/activity ──────────────────────────────────────────────────
router.get('/activity', (req, res) => {
  const isSalesRep = req.user.role === 'sales';

  let query = `
    SELECT
      a.*,
      u.name AS actor_name,
      l.first_name || ' ' || l.last_name AS lead_name,
      l.email AS lead_email
    FROM lead_activities a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN leads l ON l.id = a.lead_id
  `;
  const params = [];

  if (isSalesRep) {
    query += ' WHERE l.assigned_rep_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY a.created_at DESC LIMIT 50';

  const activities = db.prepare(query).all(...params);
  return res.json({ activities });
});

module.exports = router;
