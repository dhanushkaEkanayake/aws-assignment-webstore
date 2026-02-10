/**
 * Authentication Routes
 * ----------------------
 * Handles user registration, login, and logout.
 * Includes rate limiting on auth endpoints to prevent brute force attacks.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Rate limiter for auth endpoints: max 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration
router.get('/register', authController.showRegisterForm);
router.post('/register', authLimiter, authController.register);

// Login
router.get('/login', authController.showLoginForm);
router.post('/login', authLimiter, authController.login);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
