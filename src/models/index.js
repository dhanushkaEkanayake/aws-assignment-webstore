/**
 * Model Loader
 * ------------
 * Loads all Sequelize models and sets up their associations.
 * This is the single entry point for accessing any model in the application.
 *
 * Associations:
 *   - User hasMany CartItems (a user can have multiple cart items)
 *   - Product hasMany CartItems (a product can appear in multiple carts)
 *   - CartItem belongsTo User and Product
 */

const { sequelize } = require('../config/database');
const defineUser = require('./User');
const defineProduct = require('./Product');
const defineCartItem = require('./CartItem');

// Initialize models
const User = defineUser(sequelize);
const Product = defineProduct(sequelize);
const CartItem = defineCartItem(sequelize);

// Set up associations
User.hasMany(CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });

Product.hasMany(CartItem, { foreignKey: 'product_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  User,
  Product,
  CartItem,
};
