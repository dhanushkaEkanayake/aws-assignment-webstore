/**
 * CartItem Model
 * --------------
 * Represents items in a user's shopping cart.
 * Links users to products with a quantity field.
 * Uses foreign keys to maintain referential integrity with Users and Products tables.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' },
      },
    },
  }, {
    tableName: 'cart_items',
  });

  return CartItem;
};
