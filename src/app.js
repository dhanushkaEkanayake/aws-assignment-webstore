/**
 * Express Application Setup
 * --------------------------
 * Configures the Express application with all middleware, security headers,
 * template engine, session management, and route mounting.
 *
 * This file is separated from server.js to allow testing the app
 * without starting the HTTP server.
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const passport = require('./config/passport');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ---- Security Headers (Helmet.js) ----
// HSTS and upgrade-insecure-requests disabled — app runs behind ALB on HTTP.
// SSL termination happens at ALB level, not at the app.
// When ALB with HTTPS is in front, you can re-enable these.
app.use(helmet({
  hsts: false,
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://*.amazonaws.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://*.amazonaws.com'],
      imgSrc: ["'self'", 'data:', 'https://*.amazonaws.com'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'https://*.amazonaws.com'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      // NO upgrade-insecure-requests — we serve over HTTP behind ALB
    },
  },
}));

// ---- Body Parsers ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Method Override (for PUT/DELETE from HTML forms) ----
app.use(methodOverride('_method'));

// ---- Static Files ----
app.use(express.static(path.join(__dirname, '../public')));

// ---- Template Engine (EJS with Layouts) ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ---- Session Configuration ----
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ---- Passport Authentication ----
app.use(passport.initialize());
app.use(passport.session());

// ---- Flash Messages ----
app.use(flash());

// ---- Global Template Variables ----
// S3 static asset URL: when set, CSS/JS/images load from S3 instead of local /public
// Set STATIC_S3_URL to serve assets from S3 (e.g. https://bucket.s3.region.amazonaws.com/static)
const staticS3Url = process.env.STATIC_S3_URL || '';

app.use((req, res, next) => {
  // Make user and flash messages available in all templates
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  res.locals.appName = process.env.APP_NAME || 'hSenid Mobile Cloud Assignment Store';
  // Static asset base URL: empty string = local, S3 URL = serve from S3
  res.locals.staticUrl = staticS3Url;
  next();
});

// ---- Request Logging ----
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// ---- Routes ----
app.use('/', routes);

// ---- Error View (404) ----
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {},
  });
});

// ---- Global Error Handler ----
app.use(errorHandler);

module.exports = app;
