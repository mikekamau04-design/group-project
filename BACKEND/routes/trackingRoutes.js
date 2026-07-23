// ======================================================
// TRACKING ROUTES
// ======================================================

const express = require("express");

const router = express.Router();

const {

    protect,
    adminOnly

} = require("../middleware/authMiddleware");

const {

    addTracking,
    getTracking

} = require("../controllers/trackingController");

// ======================================================
// ADMIN UPDATE TRACKING
// ======================================================

router.post(

    "/:id",

    protect,
    adminOnly,

    addTracking

);

// ======================================================
// CUSTOMER VIEW TRACKING
// ======================================================

router.get(

    "/:id",

    protect,

    getTracking

);

module.exports = router;