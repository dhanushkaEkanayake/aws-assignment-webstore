/**
 * Product Routes (Public)
 * ------------------------
 * Public routes for browsing products.
 * Admin routes are in admin.js, mounted at /admin/products.
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Browse all products
router.get('/', productController.listProducts);

// View product details
router.get('/:id', productController.showProduct);

module.exports = router;
