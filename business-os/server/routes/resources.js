'use strict';

const express = require('express');
const { db }  = require('../db/database');
const { authenticate }              = require('../middleware/auth');
const { requireAdmin, requireRoles } = require('../middleware/roles');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/resources ───────────────────────────────────────────────────────
// Clients only see resources where visible_to_clients = 1
router.get('/', (req, res) => {
  let query = `
    SELECT r.*, u.name AS created_by_name
    FROM resources r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'client') {
    query += ' AND r.visible_to_clients = 1';
  }

  const { type, search } = req.query;
  if (type) {
    query += ' AND r.type = ?';
    params.push(type);
  }
  if (search) {
    query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY r.created_at DESC';

  const resources = db.prepare(query).all(...params);
  return res.json({ resources });
});

// ─── GET /api/resources/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const resource = db.prepare(`
    SELECT r.*, u.name AS created_by_name
    FROM resources r
    LEFT JOIN users u ON u.id = r.created_by
    WHERE r.id = ?
  `).get(id);

  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  if (req.user.role === 'client' && !resource.visible_to_clients) {
    return res.status(403).json({ error: 'Access denied' });
  }

  return res.json({ resource });
});

// ─── POST /api/resources ─────────────────────────────────────────────────────
router.post('/', requireRoles('admin', 'fulfillment'), (req, res) => {
  const { title, description, type, url, visible_to_clients } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required' });
  }

  const validTypes = ['pdf', 'link', 'video'];
  const resourceType = validTypes.includes(type) ? type : 'link';

  try {
    const result = db.prepare(`
      INSERT INTO resources (title, description, type, url, visible_to_clients, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      description || null,
      resourceType,
      url.trim(),
      visible_to_clients ? 1 : 0,
      req.user.id
    );

    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ resource });
  } catch (err) {
    console.error('Create resource error:', err);
    return res.status(500).json({ error: 'Failed to create resource' });
  }
});

// ─── PUT /api/resources/:id ───────────────────────────────────────────────────
router.put('/:id', requireRoles('admin', 'fulfillment'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Resource not found' });

  const { title, description, type, url, visible_to_clients } = req.body;
  const validTypes = ['pdf', 'link', 'video'];
  const resourceType = type && validTypes.includes(type) ? type : existing.type;

  db.prepare(`
    UPDATE resources SET
      title               = ?,
      description         = ?,
      type                = ?,
      url                 = ?,
      visible_to_clients  = ?
    WHERE id = ?
  `).run(
    title       || existing.title,
    description !== undefined ? description : existing.description,
    resourceType,
    url         || existing.url,
    visible_to_clients !== undefined ? (visible_to_clients ? 1 : 0) : existing.visible_to_clients,
    id
  );

  const updated = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
  return res.json({ resource: updated });
});

// ─── DELETE /api/resources/:id (admin only) ───────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT id FROM resources WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Resource not found' });

  db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  return res.json({ success: true });
});

module.exports = router;
