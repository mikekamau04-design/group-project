const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Test Route
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Auth routes working"
    });
});

// Register User
router.post("/register", authController.register);

// Login User
router.post("/login", authController.login);

// Verify Email (4-digit code)
router.post("/verify-email", authController.verifyEmail);

// Resend Verification Code
router.post("/resend-verification", authController.resendVerification);

module.exports = router;