// ======================================================
// AFRICART WITHDRAWAL ROUTES
// ======================================================

const express = require("express");

const router = express.Router();

const withdrawalController = require("../controllers/withdrawalController");

const auth = require("../middleware/authMiddleware");


// ======================================================
// VENDOR ROUTES
// ======================================================

// Get available balance
router.get(

    "/balance",

    auth.protect,

    auth.vendorOnly,

    withdrawalController.getBalance

);


// Request withdrawal
router.post(

    "/request",

    auth.protect,

    auth.vendorOnly,

    withdrawalController.requestWithdrawal

);


// Withdrawal history
router.get(

    "/history",

    auth.protect,

    auth.vendorOnly,

    withdrawalController.getMyWithdrawals

);


// ======================================================
// ADMIN ROUTES
// ======================================================


// Get all withdrawals
router.get(

    "/admin",

    auth.protect,

    auth.adminOnly,

    withdrawalController.getAllWithdrawals

);


// Approve withdrawal
router.put(

    "/approve/:id",

    auth.protect,

    auth.adminOnly,

    withdrawalController.approveWithdrawal

);


// Reject withdrawal
router.put(

    "/reject/:id",

    auth.protect,

    auth.adminOnly,

    withdrawalController.rejectWithdrawal

);


// ======================================================

module.exports = router;