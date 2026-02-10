/**
 * Database Initialization Script
 * --------------------------------
 * Creates all database tables based on Sequelize model definitions.
 * Run this script before starting the application for the first time.
 *
 * Usage: npm run init-db
 */

require('dotenv').config();

const { sequelize } = require('../src/models');
const logger = require('../src/config/logger');

async function initDatabase() {
  try {
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ force: false });
    logger.info('All database tables created/verified successfully.');

    console.log('\n✅ Database initialization complete!\n');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    console.error('\n❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initDatabase();
