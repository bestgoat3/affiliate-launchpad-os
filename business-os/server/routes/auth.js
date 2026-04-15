'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db }  = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin }  = require('../middleware/roles');
const crypto  = require('crypto');

const router = express.Router();

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
    .get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Don't send password hash to client
  const { password_hash, ...safeUser } = user;

  return res.json({
    token,
    user: safeUser,
  });
});

// ─── POST /api/auth/register (admin only) ────────────────────────────────────
router.post('/register', authenticate, requireAdmin, (req, res) => {
  const { email, password, name, role, avatar_url } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  const validRoles = ['admin', 'sales', 'fulfillment', 'client'];
  const userRole = role && validRoles.includes(role) ? role : 'sales';

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());

  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hash = bcrypt.hashSync(password, 12);

  try {
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, role, avatar_url, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(email.toLowerCase().trim(), hash, name.trim(), userRole, avatar_url || null);

    const newUser = db
      .prepare('SELECT id, email, name, role, avatar_url, active, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, email, name, role, avatar_url, active, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({ user });
});

// ─── PUT /api/auth/me  (update own profile) ───────────────────────────────────
router.put('/me', authenticate, (req, res) => {
  const { name, avatar_url, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let passwordHash = user.password_hash;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'currentPassword is required to change password' });
    }
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    passwordHash = bcrypt.hashSync(newPassword, 12);
  }

  db.prepare(`
    UPDATE users SET name = ?, avatar_url = ?, password_hash = ? WHERE id = ?
  `).run(
    name         || user.name,
    avatar_url   !== undefined ? avatar_url : user.avatar_url,
    passwordHash,
    userId
  );

  const updated = db
    .prepare('SELECT id, email, name, role, avatar_url, active, created_at FROM users WHERE id = ?')
    .get(userId);

  return res.json({ user: updated });
});

// ─── POST /api/auth/set-password ─────────────────────────────────────────────
// Lets an invited user set their own password using the invite token.
// No authentication required — the invite token IS the credential.
router.post('/set-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired invite token' });

  const hash = bcrypt.hashSync(password, 12);
  db.prepare(`
    UPDATE users SET password_hash = ?, invite_token = NULL, active = 1
    WHERE id = ?
  `).run(hash, user.id);

  return res.json({ success: true, message: 'Password set. You can now log in.' });
});

module.exports = router;
