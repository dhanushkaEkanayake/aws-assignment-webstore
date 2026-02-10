/**
 * Admin Product Routes
 * ---------------------
 * All routes here are mounted at /admin/products
 * Protected by both authentication and admin role middleware.
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All admin routes require auth + admin role
router.use(isAuthenticated, isAdmin);

// GET /admin/products — product dashboard
router.get('/', productController.adminProducts);

// GET /admin/products/new — new product form
router.get('/new', productController.showNewProductForm);

// POST /admin/products — create product
router.post('/', upload.single('image'), productController.createProduct);

// GET /admin/products/:id/edit — edit product form
router.get('/:id/edit', productController.showEditProductForm);

// PUT /admin/products/:id — update product
router.put('/:id', upload.single('image'), productController.updateProduct);

// DELETE /admin/products/:id — delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
