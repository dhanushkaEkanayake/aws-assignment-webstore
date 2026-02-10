/**
 * Cart Controller
 * ----------------
 * Handles shopping cart operations for authenticated users:
 * - View cart with items and total
 * - Add products to cart
 * - Update item quantities
 * - Remove items from cart
 * - Checkout (clear cart)
 */

const { CartItem, Product } = require('../models');
const logger = require('../config/logger');

/**
 * View the user's shopping cart
 */
async function viewCart(req, res) {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product }],
      order: [['created_at', 'DESC']],
    });

    // Calculate cart total
    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.Product.price) * item.quantity);
    }, 0);

    res.render('cart/index', {
      title: 'Shopping Cart',
      cartItems,
      total: total.toFixed(2),
    });
  } catch (error) {
    logger.error('Error viewing cart:', error);
    req.flash('error', 'Failed to load cart');
    res.redirect('/');
  }
}

/**
 * Add a product to the cart (or increment quantity if already in cart)
 */
async function addToCart(req, res) {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // Verify the product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/products');
    }

    // Check if item is already in cart
    const existingItem = await CartItem.findOne({
      where: { user_id: req.user.id, product_id: productId },
    });

    if (existingItem) {
      // Increment quantity
      existingItem.quantity += qty;
      await existingItem.save();
      logger.info(`Cart item quantity updated: user=${req.user.id}, product=${productId}, qty=${existingItem.quantity}`);
    } else {
      // Add new cart item
      await CartItem.create({
        user_id: req.user.id,
        product_id: productId,
        quantity: qty,
      });
      logger.info(`Item added to cart: user=${req.user.id}, product=${productId}`);
    }

    req.flash('success', `${product.name} added to cart`);
    res.redirect('/cart');
  } catch (error) {
    logger.error('Error adding to cart:', error);
    req.flash('error', 'Failed to add item to cart');
    res.redirect('/products');
  }
}

/**
 * Update the quantity of a cart item
 */
async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty < 1) {
      req.flash('error', 'Quantity must be at least 1');
      return res.redirect('/cart');
    }

    const cartItem = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!cartItem) {
      req.flash('error', 'Cart item not found');
      return res.redirect('/cart');
    }

    cartItem.quantity = qty;
    await cartItem.save();

    logger.info(`Cart item updated: id=${cartItem.id}, qty=${qty}`);
    req.flash('success', 'Cart updated');
    res.redirect('/cart');
  } catch (error) {
    logger.error('Error updating cart:', error);
    req.flash('error', 'Failed to update cart');
    res.redirect('/cart');
  }
}

/**
 * Remove an item from the cart
 */
async function removeFromCart(req, res) {
  try {
    const cartItem = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!cartItem) {
      req.flash('error', 'Cart item not found');
      return res.redirect('/cart');
    }

    await cartItem.destroy();
    logger.info(`Cart item removed: id=${req.params.id}, user=${req.user.id}`);
    req.flash('success', 'Item removed from cart');
    res.redirect('/cart');
  } catch (error) {
    logger.error('Error removing from cart:', error);
    req.flash('error', 'Failed to remove item');
    res.redirect('/cart');
  }
}

/**
 * Checkout: Clear all items from the user's cart
 * (Simple checkout — no payment processing for this training app)
 */
async function checkout(req, res) {
  try {
    const itemCount = await CartItem.destroy({
      where: { user_id: req.user.id },
    });

    if (itemCount === 0) {
      req.flash('info', 'Your cart is already empty');
      return res.redirect('/cart');
    }

    logger.info(`Checkout completed: user=${req.user.id}, items cleared=${itemCount}`);
    req.flash('success', 'Order placed successfully! Thank you for your purchase.');
    res.redirect('/');
  } catch (error) {
    logger.error('Error during checkout:', error);
    req.flash('error', 'Checkout failed. Please try again.');
    res.redirect('/cart');
  }
}

module.exports = {
  viewCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkout,
};
