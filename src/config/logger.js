/**
 * Winston Logger Configuration
 * -----------------------------
 * Configures application logging with Winston.
 * - Development: Logs to console with colorized output
 * - Production: Logs to files in the EFS-mounted /logs directory with daily rotation
 *
 * EFS Integration:
 *   In production on AWS, the logs directory is mounted to an EFS volume,
 *   enabling persistent log storage shared across container instances.
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Determine log directory:
//   Production (EC2): EFS mounted at /logs on host, bind-mounted into container via -v /logs:/app/logs
//   Development: local ./logs directory
const logDir = process.env.EFS_LOGS_PATH || path.join(__dirname, '../../logs');

// Custom log format with timestamp and structured JSON
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development (colorized, readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Build transports array based on environment
const transports = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  })
);

// Add file transports in production (writes to EFS-mounted directory)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  // Verify the log directory is writable before adding file transports
  const fs = require('fs');
  let logDirWritable = false;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.accessSync(logDir, fs.constants.W_OK);
    logDirWritable = true;
  } catch (err) {
    // Log directory not writable — skip file transports
    console.warn(`Warning: Log directory "${logDir}" is not writable, file logging disabled.`);
  }

  if (logDirWritable) {
    // Daily rotating application log
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d', // Keep logs for 7 days
        format: logFormat,
      })
    );

    // Separate error log for quick error investigation
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d', // Keep error logs for 14 days
        level: 'error',
        format: logFormat,
      })
    );
  }
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports,
  // Don't exit on uncaught exceptions — let the process handle them
  exitOnError: false,
});

module.exports = logger;
