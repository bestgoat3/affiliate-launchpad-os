'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }  = require('../middleware/auth');
const { requireStaff, requireRoles, requireAdmin } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate, requireStaff);

// ─── CONTENT POSTS ────────────────────────────────────────────────────────────

// GET /api/marketing/content
router.get('/content', (req, res) => {
  const { platform, format, sort = 'posted_at', order = 'DESC', limit = 50, offset = 0 } = req.query;

  const validSortCols = ['posted_at', 'views', 'clicks', 'leads_generated', 'created_at'];
  const sortCol   = validSortCols.includes(sort) ? sort : 'posted_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let query  = 'SELECT * FROM content_posts WHERE 1=1';
  const params = [];

  const validPlatforms = ['TikTok', 'Instagram', 'YouTube'];
  const validFormats   = ['Hook', 'Story', 'CTA', 'Tutorial'];

  if (platform && validPlatforms.includes(platform)) {
    query += ' AND platform = ?';
    params.push(platform);
  }
  if (format && validFormats.includes(format)) {
    query += ' AND format = ?';
    params.push(format);
  }

  query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const posts = db.prepare(query).all(...params);
  return res.json({ posts });
});

// POST /api/marketing/content
router.post('/content', requireRoles('admin', 'sales', 'fulfillment'), (req, res) => {
  const { platform, format, title, posted_at, views, clicks, leads_generated, notes } = req.body;

  const validPlatforms = ['TikTok', 'Instagram', 'YouTube'];
  const validFormats   = ['Hook', 'Story', 'CTA', 'Tutorial'];

  if (!platform || !validPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'platform must be one of: TikTok, Instagram, YouTube' });
  }
  if (!format || !validFormats.includes(format)) {
    return res.status(400).json({ error: 'format must be one of: Hook, Story, CTA, Tutorial' });
  }
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const result = db.prepare(`
    INSERT INTO content_posts (platform, format, title, posted_at, views, clicks, leads_generated, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    platform,
    format,
    title.trim(),
    posted_at       || null,
    views           || 0,
    clicks          || 0,
    leads_generated || 0,
    notes           || null
  );

  const post = db.prepare('SELECT * FROM content_posts WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ post });
});

// PUT /api/marketing/content/:id
router.put('/content/:id', requireRoles('admin', 'sales', 'fulfillment'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM content_posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Content post not found' });

  const { platform, format, title, posted_at, views, clicks, leads_generated, notes } = req.body;

  const validPlatforms = ['TikTok', 'Instagram', 'YouTube'];
  const validFormats   = ['Hook', 'Story', 'CTA', 'Tutorial'];

  db.prepare(`
    UPDATE content_posts SET
      platform        = ?,
      format          = ?,
      title           = ?,
      posted_at       = ?,
      views           = ?,
      clicks          = ?,
      leads_generated = ?,
      notes           = ?
    WHERE id = ?
  `).run(
    platform         && validPlatforms.includes(platform) ? platform        : existing.platform,
    format           && validFormats.includes(format)     ? format          : existing.format,
    title            ? title.trim()                       : existing.title,
    posted_at        !== undefined                        ? posted_at       : existing.posted_at,
    views            !== undefined                        ? views           : existing.views,
    clicks           !== undefined                        ? clicks          : existing.clicks,
    leads_generated  !== undefined                        ? leads_generated : existing.leads_generated,
    notes            !== undefined                        ? notes           : existing.notes,
    id
  );

  const updated = db.prepare('SELECT * FROM content_posts WHERE id = ?').get(id);
  return res.json({ post: updated });
});

// DELETE /api/marketing/content/:id
router.delete('/content/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM content_posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Content post not found' });

  db.prepare('DELETE FROM content_posts WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

// GET /api/marketing/campaigns
router.get('/campaigns', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let query  = 'SELECT * FROM campaigns WHERE 1=1';
  const params = [];

  const validStatuses = ['active', 'paused', 'completed'];
  if (status && validStatuses.includes(status)) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const campaigns = db.prepare(query).all(...params);
  return res.json({ campaigns });
});

// POST /api/marketing/campaigns
router.post('/campaigns', requireRoles('admin', 'sales', 'fulfillment'), (req, res) => {
  const {
    name, platform, start_date, end_date,
    budget_spent, leads_generated, revenue_attributed, cpl, roas, status,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const validStatuses = ['active', 'paused', 'completed'];
  const campaignStatus = status && validStatuses.includes(status) ? status : 'active';

  const result = db.prepare(`
    INSERT INTO campaigns
      (name, platform, start_date, end_date, budget_spent,
       leads_generated, revenue_attributed, cpl, roas, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    platform          || null,
    start_date        || null,
    end_date          || null,
    budget_spent      || 0,
    leads_generated   || 0,
    revenue_attributed|| 0,
    cpl               || 0,
    roas              || 0,
    campaignStatus
  );

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ campaign });
});

// PUT /api/marketing/campaigns/:id
router.put('/campaigns/:id', requireRoles('admin', 'sales', 'fulfillment'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const {
    name, platform, start_date, end_date,
    budget_spent, leads_generated, revenue_attributed, cpl, roas, status,
  } = req.body;

  const validStatuses = ['active', 'paused', 'completed'];

  db.prepare(`
    UPDATE campaigns SET
      name               = ?,
      platform           = ?,
      start_date         = ?,
      end_date           = ?,
      budget_spent       = ?,
      leads_generated    = ?,
      revenue_attributed = ?,
      cpl                = ?,
      roas               = ?,
      status             = ?
    WHERE id = ?
  `).run(
    name               ? name.trim()                             : existing.name,
    platform           !== undefined                            ? platform            : existing.platform,
    start_date         !== undefined                            ? start_date          : existing.start_date,
    end_date           !== undefined                            ? end_date            : existing.end_date,
    budget_spent       !== undefined                            ? budget_spent        : existing.budget_spent,
    leads_generated    !== undefined                            ? leads_generated     : existing.leads_generated,
    revenue_attributed !== undefined                            ? revenue_attributed  : existing.revenue_attributed,
    cpl                !== undefined                            ? cpl                 : existing.cpl,
    roas               !== undefined                            ? roas                : existing.roas,
    status && validStatuses.includes(status) ? status : existing.status,
    id
  );

  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  return res.json({ campaign: updated });
});

// ─── GET /api/marketing/overview ─────────────────────────────────────────────
router.get('/overview', (req, res) => {
  // Traffic sources (leads by source)
  const trafficSources = db.prepare(`
    SELECT
      source,
      COUNT(*) AS lead_count
    FROM leads
    WHERE source IS NOT NULL
    GROUP BY source
    ORDER BY lead_count DESC
    LIMIT 10
  `).all();

  // Top content by leads generated
  const topContent = db.prepare(`
    SELECT * FROM content_posts
    WHERE leads_generated > 0
    ORDER BY leads_generated DESC
    LIMIT 5
  `).all();

  // Platform performance (content posts)
  const platformStats = db.prepare(`
    SELECT
      platform,
      COUNT(*)            AS post_count,
      SUM(views)          AS total_views,
      SUM(clicks)         AS total_clicks,
      SUM(leads_generated) AS total_leads
    FROM content_posts
    GROUP BY platform
    ORDER BY total_leads DESC
  `).all();

  // Active campaigns summary
  const activeCampaigns = db.prepare(`
    SELECT
      COUNT(*)                   AS count,
      SUM(budget_spent)          AS total_spend,
      SUM(leads_generated)       AS total_leads,
      SUM(revenue_attributed)    AS total_revenue,
      ROUND(AVG(roas), 2)        AS avg_roas,
      ROUND(AVG(cpl), 2)         AS avg_cpl
    FROM campaigns
    WHERE status = 'active'
  `).get();

  return res.json({
    traffic_sources:  trafficSources,
    top_content:      topContent,
    platform_stats:   platformStats,
    active_campaigns: activeCampaigns,
  });
});

module.exports = router;
