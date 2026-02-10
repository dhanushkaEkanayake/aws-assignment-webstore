/**
 * Server Startup
 * ---------------
 * Initializes the database connection, syncs models, and starts the HTTP server.
 * Includes graceful shutdown handling for Docker container stop signals.
 */

const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Starting server without database connection. Some features may not work.');
    }

    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Database models synchronized');

    // Start the HTTP server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`hSenid Mobile Cloud Assignment Store running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // ---- Graceful Shutdown ----
    // Handle Docker SIGTERM (container stop) and SIGINT (Ctrl+C)
    const shutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database:', err);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
