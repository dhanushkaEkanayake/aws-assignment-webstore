/**
 * Global Error Handler Middleware
 * --------------------------------
 * Catches all unhandled errors and returns appropriate responses.
 * Logs errors with Winston and shows user-friendly messages.
 */

const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  // Log the full error for debugging
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Handle Multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    req.flash('error', 'File is too large. Maximum size is 5MB.');
    return res.redirect('back');
  }

  // Handle Multer file type errors
  if (err.message && err.message.includes('Only image files')) {
    req.flash('error', err.message);
    return res.redirect('back');
  }

  // Handle CSRF token errors
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Invalid form submission. Please try again.');
    return res.redirect('back');
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map((e) => e.message);
    req.flash('error', messages.join(', '));
    return res.redirect('back');
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again later.'
    : err.message;

  res.status(statusCode).render('error', {
    title: 'Error',
    message,
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
}

module.exports = errorHandler;
