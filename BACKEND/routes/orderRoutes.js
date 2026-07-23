// ======================================================
// ORDER ROUTES
// ======================================================

const express = require("express");
const router = express.Router();

const {
    protect,
    customerOnly,
    vendorOnly,
    adminOnly
} = require("../middleware/authMiddleware");

const {
    checkout,
    getMyOrders,
    getOrderDetails,
    cancelOrder,
    getVendorOrders,
    getAllOrders,
    updateOrderStatus,
    acceptOrder,
    rejectOrder,
    shipOrder,
    deliverOrder
} = require("../controllers/orderController");

// ======================================================
// CUSTOMER ROUTES
// ======================================================

// Checkout
router.post(
    "/checkout",
    protect,
    customerOnly,
    checkout
);

// Customer Orders
router.get(
    "/my",
    protect,
    customerOnly,
    getMyOrders
);

// Cancel Order
router.put(
    "/cancel/:id",
    protect,
    customerOnly,
    cancelOrder
);

// ======================================================
// VENDOR ROUTES
// ======================================================

// Vendor Orders
router.get(
    "/vendor/orders",
    protect,
    vendorOnly,
    getVendorOrders
);

// Accept Order
router.put(
    "/:id/accept",
    protect,
    vendorOnly,
    acceptOrder
);

// Reject Order
router.put(
    "/:id/reject",
    protect,
    vendorOnly,
    rejectOrder
);

// Ship Order
router.put(
    "/:id/ship",
    protect,
    vendorOnly,
    shipOrder
);

// Deliver Order
router.put(
    "/:id/deliver",
    protect,
    vendorOnly,
    deliverOrder
);

// ======================================================
// ADMIN ROUTES
// ======================================================

// Get All Orders
router.get(
    "/admin",
    protect,
    adminOnly,
    getAllOrders
);

// Update Order Status
router.put(
    "/:id/status",
    protect,
    adminOnly,
    updateOrderStatus
);

// ======================================================
// ORDER DETAILS
// MUST BE LAST
// ======================================================

router.get(
    "/:id",
    protect,
    getOrderDetails
);

module.exports = router;