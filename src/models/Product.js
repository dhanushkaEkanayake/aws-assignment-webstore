/**
 * Product Model
 * -------------
 * Represents products in the store.
 * Images are stored in AWS S3, with the S3 key and public URL saved here.
 * Categories help organize products for browsing and filtering.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Price must be a valid number' },
        min: { args: [0], msg: 'Price must be positive' },
      },
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    s3_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  }, {
    tableName: 'products',
  });

  return Product;
};
