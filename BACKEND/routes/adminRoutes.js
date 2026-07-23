// ======================================================
// ADMIN ROUTES
// ======================================================

const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

// Protect all admin routes
router.use(protect);
router.use(adminOnly);

// ======================================================
// DASHBOARD
// ======================================================

router.get(
    "/dashboard",
    adminController.getDashboard
);

// ======================================================
// USERS
// ======================================================

router.get(
    "/users",
    adminController.getUsers
);

router.delete(
    "/users/:id",
    adminController.deleteUser
);

// ======================================================
// VENDORS
// ======================================================

router.get(
    "/vendors",
    adminController.getVendors
);

router.put(
    "/vendors/:id/approve",
    adminController.approveVendor
);

router.delete(
    "/vendors/:id",
    adminController.deleteVendor
);

// ======================================================
// PRODUCTS
// ======================================================

router.get(
    "/products",
    adminController.getProducts
);

router.delete(
    "/products/:id",
    adminController.deleteProduct
);

router.patch(
    "/products/:id/status",
    adminController.toggleProductStatus
);
// ======================================================
// ORDERS
// ======================================================

router.get(
    "/orders",
    adminController.getOrders
);

router.put(
    "/orders/:id",
    adminController.updateOrderStatus
);

// ======================================================
// WITHDRAWALS
// ======================================================
// Handled by withdrawalRoutes.js (mounted at /api/withdrawals),
// which has the pending-status guard, transaction codes, and
// vendor email notifications that this duplicate set lacked.

// ======================================================
// PROFILE
// ======================================================

router.get(
    "/profile",
    adminController.getProfile
);

router.put(
    "/profile",
    adminController.updateProfile
);


module.exports = router;