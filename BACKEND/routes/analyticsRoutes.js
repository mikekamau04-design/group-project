// ======================================================
// AFRICART ANALYTICS ROUTES
// ======================================================

const express = require("express");

const router = express.Router();

const analyticsController =
require("../controllers/analyticsController");

const auth =
require("../middleware/authMiddleware");


// ======================================================
// ADMIN ONLY
// ======================================================

router.get(

    "/summary",

    auth.protect,

    auth.adminOnly,

    analyticsController.getDashboardSummary

);

router.get(

    "/monthly-sales",

    auth.protect,

    auth.adminOnly,

    analyticsController.getMonthlySales

);

router.get(

    "/best-products",

    auth.protect,

    auth.adminOnly,

    analyticsController.getBestSellingProducts

);

module.exports = router;