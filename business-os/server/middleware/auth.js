'use strict';

const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

/**
 * Verifies the JWT in the Authorization header.
 * Attaches `req.user` on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Fetch fresh user from DB to ensure active + role is current
  const user = db
    .prepare('SELECT id, email, name, role, avatar_url, active FROM users WHERE id = ?')
    .get(payload.id);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (!user.active) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  req.user = user;
  next();
}

module.exports = { authenticate };
