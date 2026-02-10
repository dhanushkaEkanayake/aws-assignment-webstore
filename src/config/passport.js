/**
 * Passport.js Authentication Configuration
 * ------------------------------------------
 * Sets up the local authentication strategy using email and password.
 * Passwords are hashed with bcrypt for secure storage.
 * Serialization stores only the user ID in the session for efficiency.
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('./logger');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',    // Use email instead of username
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find user by email (case-insensitive)
        const user = await User.findOne({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
          logger.warn(`Login attempt with unknown email: ${email}`);
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Compare provided password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          logger.warn(`Failed login attempt for: ${email}`);
          return done(null, false, { message: 'Invalid email or password' });
        }

        logger.info(`User logged in: ${email}`);
        return done(null, user);
      } catch (error) {
        logger.error('Passport authentication error:', error);
        return done(error);
      }
    }
  )
);

// Store only user ID in session (minimizes session data)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieve full user object from ID stored in session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
