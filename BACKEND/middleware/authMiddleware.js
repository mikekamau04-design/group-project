// ======================================================
// AUTH MIDDLEWARE
// JWT Authentication & Role Authorization
// ======================================================

const jwt = require("jsonwebtoken");

// ======================================================
// VERIFY JWT TOKEN
// ======================================================

const protect = (req, res, next) => {
    try {
        let token = null;

        // Get token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "africart_secret_key"
        );

        // Save decoded user information
        req.user = decoded;

        next();

    } catch (error) {

        console.error("JWT Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

// ======================================================
// ADMIN ONLY
// ======================================================

const adminOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only."
        });
    }

    next();
};

// ======================================================
// VENDOR ONLY
// ======================================================

const vendorOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });
    }

    if (req.user.role !== "vendor") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Vendors only."
        });
    }

    next();
};

// ======================================================
// CUSTOMER ONLY
// ======================================================

const customerOnly = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        });
    }

    if (req.user.role !== "customer") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Customers only."
        });
    }

    next();
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    protect,
    adminOnly,
    vendorOnly,
    customerOnly
};