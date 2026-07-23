// ======================================================
// VENDOR ROUTES
// ======================================================

const express = require("express");

const router = express.Router();

const {

    protect,

    vendorOnly

} = require("../middleware/authMiddleware");

const {

    getDashboard,

    getVendorProfile,

    getMonthlySales,

    getRecentOrders,

    updateVendorProfile,

    getVendorEarnings,

    getDashboardSummary

} = require("../controllers/vendorController");

// ======================================================
// DASHBOARD
// ======================================================

router.get(

    "/dashboard",

    protect,

    vendorOnly,

    getDashboard

);

// ======================================================
// PROFILE
// ======================================================

router.get(

    "/profile",

    protect,

    vendorOnly,

    getVendorProfile

);

router.put(

    "/profile",

    protect,

    vendorOnly,

    updateVendorProfile

);

// ======================================================
// SALES
// ======================================================

router.get(

    "/sales",

    protect,

    vendorOnly,

    getMonthlySales

);

// ======================================================
// RECENT ORDERS
// ======================================================

router.get(

    "/orders",

    protect,

    vendorOnly,

    getRecentOrders

);

// ======================================================
// EARNINGS
// ======================================================

router.get(

    "/earnings",

    protect,

    vendorOnly,

    getVendorEarnings

);

// ======================================================
// DASHBOARD SUMMARY
// ======================================================

router.get(

    "/summary",

    protect,

    vendorOnly,

    getDashboardSummary

);

module.exports = router;