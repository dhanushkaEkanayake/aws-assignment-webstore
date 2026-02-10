/**
 * Main Router
 * ------------
 * Aggregates all route modules and defines the health check endpoint.
 * The health check is used by AWS ALB for container health monitoring.
 */

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { s3Client } = require('../config/aws');
const { ListBucketsCommand } = require('@aws-sdk/client-s3');
const logger = require('../config/logger');

// Import route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const adminRoutes = require('./admin');
const cartRoutes = require('./cart');

// ---- Health Check Endpoint (for ALB) ----
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    database: 'disconnected',
    s3: 'inaccessible',
  };

  // Check database connectivity
  try {
    await sequelize.authenticate();
    health.database = 'connected';
  } catch (err) {
    health.status = 'degraded';
    logger.warn('Health check: database disconnected');
  }

  // Check S3 accessibility
  try {
    await s3Client.send(new ListBucketsCommand({}));
    health.s3 = 'accessible';
  } catch (err) {
    health.status = 'degraded';
    logger.warn('Health check: S3 inaccessible');
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ---- Home Page ----
router.get('/', (req, res) => {
  res.redirect('/products');
});

// ---- Mount Routes ----
router.use('/', authRoutes);
router.use('/products', productRoutes);
router.use('/admin/products', adminRoutes);
router.use('/cart', cartRoutes);

module.exports = router;
