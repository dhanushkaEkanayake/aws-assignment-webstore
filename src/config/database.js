/**
 * Database Configuration
 * ---------------------
 * Configures Sequelize ORM to connect to either PostgreSQL or MySQL.
 * The dialect is determined by the DB_DIALECT environment variable.
 * Includes connection pooling for production use with AWS RDS.
 */

const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Build the Sequelize instance from environment variables
// Build dialect options — RDS PostgreSQL requires SSL in production
const dialectOptions = {};
if (process.env.NODE_ENV === 'production' && (process.env.DB_DIALECT || 'postgres') === 'postgres') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false, // RDS uses Amazon-issued certs; this allows connection
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cloudmart',
  process.env.DB_USER || 'dbuser',
  process.env.DB_PASSWORD || 'dbpassword',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: process.env.DB_DIALECT || 'postgres', // 'postgres' or 'mysql'
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,

    // SSL for RDS connections
    dialectOptions,

    // Connection pool configuration for production stability
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },

    // Retry logic for transient connection failures (useful for RDS)
    retry: {
      max: 3,
    },

    define: {
      timestamps: true,
      underscored: true, // Use snake_case column names
    },
  }
);

/**
 * Test the database connection.
 * Called during application startup to verify RDS connectivity.
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info(`Database connected successfully (${process.env.DB_DIALECT || 'postgres'})`);
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };
