const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// Protected Route
router.get("/profile", protect, (req, res) => {

    res.status(200).json({
        success: true,
        message: "Profile loaded successfully",
        user: req.user
    });

});

module.exports = router;