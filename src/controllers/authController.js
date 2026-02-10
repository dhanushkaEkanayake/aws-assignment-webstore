/**
 * Authentication Controller
 * --------------------------
 * Handles user registration, login, and logout.
 * Uses Passport.js local strategy for authentication.
 */

const { User } = require('../models');
const passport = require('passport');
const logger = require('../config/logger');

/**
 * Show registration form
 */
function showRegisterForm(req, res) {
  res.render('auth/register', { title: 'Register' });
}

/**
 * Handle user registration
 */
async function register(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    // Validate password length
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/register');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists');
      return res.redirect('/register');
    }

    // Create the new user (password is hashed by the model hook)
    await User.create({
      email: email.toLowerCase().trim(),
      password,
      role: 'customer',
    });

    logger.info(`New user registered: ${email}`);
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (error) {
    logger.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
}

/**
 * Show login form
 */
function showLoginForm(req, res) {
  res.render('auth/login', { title: 'Login' });
}

/**
 * Handle user login using Passport.js
 */
function login(req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
}

/**
 * Handle user logout
 */
function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return next(err);
    }
    req.flash('success', 'You have been logged out');
    res.redirect('/login');
  });
}

module.exports = {
  showRegisterForm,
  register,
  showLoginForm,
  login,
  logout,
};
