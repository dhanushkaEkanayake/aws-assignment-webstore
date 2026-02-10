/**
 * User Model
 * ----------
 * Represents application users with email/password authentication.
 * Supports two roles: 'customer' (default) and 'admin'.
 * Passwords are automatically hashed before saving using bcrypt.
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email address' },
        notEmpty: { msg: 'Email is required' },
      },
      set(value) {
        // Normalize email to lowercase
        this.setDataValue('email', value.toLowerCase().trim());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: { args: [6, 255], msg: 'Password must be at least 6 characters long' },
      },
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'customer',
      validate: {
        isIn: { args: [['customer', 'admin']], msg: 'Role must be customer or admin' },
      },
    },
  }, {
    tableName: 'users',
    hooks: {
      // Hash password before creating a new user
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password before updating if it changed
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  });

  // Instance method to check if user is admin
  User.prototype.isAdmin = function () {
    return this.role === 'admin';
  };

  return User;
};
