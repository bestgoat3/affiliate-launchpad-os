'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }  = require('../middleware/auth');
const { requireStaff }  = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/pipeline ────────────────────────────────────────────────────────
// Returns all pipeline stages with leads nested inside each
router.get('/', requireStaff, (req, res) => {
  const stages = db.prepare(`
    SELECT * FROM pipeline_stages ORDER BY order_index ASC
  `).all();

  // Build WHERE clause for sales reps (only own leads)
  const isSalesRep = req.user.role === 'sales';

  const result = stages.map(stage => {
    let query = `
      SELECT l.*, u.name AS rep_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_rep_id
      WHERE l.stage = ?
    `;
    const params = [stage.name];

    if (isSalesRep) {
      query += ' AND l.assigned_rep_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY l.updated_at DESC';

    const leads = db.prepare(query).all(...params);
    const count = leads.length;

    return {
      ...stage,
      lead_count: count,
      leads: leads.map(l => ({
        ...l,
        tags: (() => {
          try { return JSON.parse(l.tags || '[]'); } catch { return []; }
        })(),
      })),
    };
  });

  return res.json({ pipeline: result });
});

// ─── GET /api/pipeline/stages ─────────────────────────────────────────────────
router.get('/stages', requireStaff, (req, res) => {
  const stages = db.prepare(`
    SELECT
      ps.*,
      COUNT(l.id) AS lead_count
    FROM pipeline_stages ps
    LEFT JOIN leads l ON l.stage = ps.name
    GROUP BY ps.id
    ORDER BY ps.order_index ASC
  `).all();

  return res.json({ stages });
});

module.exports = router;
