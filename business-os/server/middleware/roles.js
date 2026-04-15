'use strict';

/**
 * Role hierarchy:
 *   admin       → full access
 *   sales       → leads, pipeline, sales metrics
 *   fulfillment → clients, resources, deliverables
 *   client      → own portal data only
 *
 * Usage: requireRoles('admin', 'sales')
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Admin always passes
    if (req.user.role === 'admin') return next();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Convenience: admin only
 */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Convenience: not a plain client (i.e. internal staff)
 */
function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role === 'client') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
}

module.exports = { requireRoles, requireAdmin, requireStaff };
