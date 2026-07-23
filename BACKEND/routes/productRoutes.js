// ======================================================
// PRODUCT ROUTES
// ======================================================

const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const productController = require("../controllers/productController");

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Get all products
router.get(
    "/",
    productController.getProducts
);

// Search products
router.get(
    "/search",
    productController.searchProducts
);

// Products by category
router.get(
    "/category/:category",
    productController.getProductsByCategory
);

// Paginated products
router.get(
    "/page/list",
    productController.getProductsPaginated
);

// ======================================================
// VENDOR ROUTES
// ======================================================

// Get logged-in vendor products
router.get(
    "/vendor/my-products",
    auth.protect,
    auth.vendorOnly,
    productController.getMyProducts
);

// Add product
router.post(
    "/",
    auth.protect,
    auth.vendorOnly,
    upload.single("image"),
    productController.addProduct
);

// Update product
router.put(
    "/:id",
    auth.protect,
    auth.vendorOnly,
    upload.single("image"),
    productController.updateProduct
);

// Delete product
router.delete(
    "/:id",
    auth.protect,
    auth.vendorOnly,
    productController.deleteProduct
);

// Toggle Active / Inactive status
router.patch(
    "/:id/status",
    auth.protect,
    auth.vendorOnly,
    productController.toggleProductStatus
);

// ======================================================
// PUBLIC SINGLE PRODUCT
// KEEP THIS ROUTE LAST
// ======================================================

router.get(
    "/:id",
    productController.getProductById
);

module.exports = router;