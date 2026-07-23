const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const cartController = require("../controllers/cartController");

// Get cart
router.get(
    "/",
    protect,
    cartController.getCart
);

// Add to cart
router.post(
    "/",
    protect,
    cartController.addToCart
);

// Update cart item
router.put(
    "/:id",
    protect,
    cartController.updateCartItem
);

// Remove one item
router.delete(
    "/:id",
    protect,
    cartController.removeCartItem
);

// Clear cart
router.delete(
    "/",
    protect,
    cartController.clearCart
);

module.exports = router;