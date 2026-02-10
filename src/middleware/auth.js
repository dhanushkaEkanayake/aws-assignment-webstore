/**
 * Authentication Middleware
 * -------------------------
 * Provides route protection middleware for authenticated and admin-only routes.
 */

const logger = require('../config/logger');

/**
 * Ensure the user is authenticated.
 * Redirects to login page if not authenticated.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Please log in to access this page');
  res.redirect('/login');
}

/**
 * Ensure the user is an admin.
 * Must be used after isAuthenticated middleware.
 * Returns 403 if user is not an admin.
 */
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  logger.warn(`Unauthorized admin access attempt by user ${req.user ? req.user.email : 'unknown'}`);
  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/');
}

module.exports = { isAuthenticated, isAdmin };
