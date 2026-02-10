/**
 * Product Controller
 * -------------------
 * Handles all product-related operations:
 * - Public: Browse, search, view product details
 * - Admin: Create, edit, delete products with S3 image upload
 */

const { Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');

// Use iLike for PostgreSQL (case-insensitive), like for MySQL
const likeOp = (process.env.DB_DIALECT || 'postgres') === 'postgres' ? Op.iLike : Op.like;

/**
 * List all products with optional search and category filter (public)
 */
async function listProducts(req, res) {
  try {
    const { search, category } = req.query;
    const where = {};

    // Apply search filter (name or description)
    if (search) {
      where[Op.or] = [
        { name: { [likeOp]: `%${search}%` } },
        { description: { [likeOp]: `%${search}%` } },
      ];
    }

    // Apply category filter
    if (category) {
      where.category = category;
    }

    const products = await Product.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    // Get unique categories for the filter sidebar
    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      where: { category: { [Op.ne]: null } },
    });

    res.render('products/index', {
      title: 'Products',
      products,
      categories: categories.map((c) => c.category),
      search: search || '',
      selectedCategory: category || '',
    });
  } catch (error) {
    logger.error('Error listing products:', error);
    req.flash('error', 'Failed to load products');
    res.redirect('/');
  }
}

/**
 * Show product details (public)
 */
async function showProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/products');
    }

    res.render('products/details', {
      title: product.name,
      product,
    });
  } catch (error) {
    logger.error('Error showing product:', error);
    req.flash('error', 'Failed to load product');
    res.redirect('/products');
  }
}

/**
 * Admin: Show product management dashboard
 */
async function adminProducts(req, res) {
  try {
    const products = await Product.findAll({
      order: [['created_at', 'DESC']],
    });

    res.render('products/admin', {
      title: 'Admin - Products',
      products,
    });
  } catch (error) {
    logger.error('Error loading admin products:', error);
    req.flash('error', 'Failed to load products');
    res.redirect('/');
  }
}

/**
 * Admin: Show new product form
 */
function showNewProductForm(req, res) {
  res.render('products/new', { title: 'Add New Product' });
}

/**
 * Admin: Create a new product with optional S3 image upload
 */
async function createProduct(req, res) {
  try {
    const { name, description, price, category } = req.body;

    // Create the product first to get its ID
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
    });

    // Upload image to S3 if provided
    if (req.file) {
      try {
        const { url, key } = await s3Service.uploadProductImage(req.file, product.id);
        product.image_url = url;
        product.s3_key = key;
        await product.save();
      } catch (uploadError) {
        logger.warn(`S3 upload failed, product created without image: ${uploadError.message}`);
        req.flash('warning', 'Product created but image upload failed. You can add an image later.');
      }
    }

    logger.info(`Product created: ${product.name} (ID: ${product.id})`);
    req.flash('success', 'Product created successfully');
    res.redirect('/admin/products');
  } catch (error) {
    logger.error('Error creating product:', error);
    req.flash('error', 'Failed to create product');
    res.redirect('/admin/products/new');
  }
}

/**
 * Admin: Show edit product form
 */
async function showEditProductForm(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    res.render('products/edit', {
      title: `Edit: ${product.name}`,
      product,
    });
  } catch (error) {
    logger.error('Error loading edit form:', error);
    req.flash('error', 'Failed to load product');
    res.redirect('/admin/products');
  }
}

/**
 * Admin: Update an existing product
 */
async function updateProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    const { name, description, price, category } = req.body;
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.category = category;

    // Upload new image to S3 if provided
    if (req.file) {
      try {
        // Delete old image from S3 if it exists
        if (product.s3_key) {
          await s3Service.deleteProductImage(product.s3_key);
        }
        const { url, key } = await s3Service.uploadProductImage(req.file, product.id);
        product.image_url = url;
        product.s3_key = key;
      } catch (uploadError) {
        logger.warn('S3 upload failed during update:', uploadError.message);
        req.flash('warning', 'Product updated but image upload failed.');
      }
    }

    await product.save();
    logger.info(`Product updated: ${product.name} (ID: ${product.id})`);
    req.flash('success', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (error) {
    logger.error('Error updating product:', error);
    req.flash('error', 'Failed to update product');
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
}

/**
 * Admin: Delete a product and its S3 image
 */
async function deleteProduct(req, res) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    // Delete image from S3 if it exists
    if (product.s3_key) {
      await s3Service.deleteProductImage(product.s3_key);
    }

    const productName = product.name;
    await product.destroy();

    logger.info(`Product deleted: ${productName} (ID: ${req.params.id})`);
    req.flash('success', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (error) {
    logger.error('Error deleting product:', error);
    req.flash('error', 'Failed to delete product');
    res.redirect('/admin/products');
  }
}

module.exports = {
  listProducts,
  showProduct,
  adminProducts,
  showNewProductForm,
  createProduct,
  showEditProductForm,
  updateProduct,
  deleteProduct,
};
