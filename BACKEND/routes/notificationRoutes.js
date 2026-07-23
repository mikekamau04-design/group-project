// ======================================================
// NOTIFICATION ROUTES
// ======================================================

const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const notificationController =
require("../controllers/notificationController");


// ======================================================
// USER ROUTES
// ======================================================

router.get(

    "/",

    auth.protect,

    notificationController.getMyNotifications

);

router.put(

    "/read-all",

    auth.protect,

    notificationController.markAllAsRead

);

router.put(

    "/read/:id",

    auth.protect,

    notificationController.markAsRead

);

router.delete(

    "/:id",

    auth.protect,

    notificationController.deleteNotification

);


// ======================================================

module.exports = router;