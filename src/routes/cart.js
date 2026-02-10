/**
 * Cart Routes
 * ------------
 * All cart routes require authentication.
 * Handles viewing cart, adding/updating/removing items, and checkout.
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

// All cart routes require authentication
router.use(isAuthenticated);

// View cart
router.get('/', cartController.viewCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.post('/update/:id', cartController.updateCartItem);

// Remove item from cart
router.post('/remove/:id', cartController.removeFromCart);

// Checkout
router.post('/checkout', cartController.checkout);

module.exports = router;
