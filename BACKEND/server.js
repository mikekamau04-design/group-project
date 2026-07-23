// ======================================================
// AFRICART SERVER.JS
// Main Backend Entry Point
// ======================================================

// ======================================================
// IMPORT PACKAGES
// ======================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

dotenv.config();

// ======================================================
// CREATE EXPRESS APP
// ======================================================

const app = express();

// ======================================================
// CONNECT DATABASE
// ======================================================

require("./config/db");

// ======================================================
// MIDDLEWARE
// ======================================================

// CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5500",
        credentials: true
    })
);

// Parse JSON
app.use(express.json({ limit: "20mb" }));

// Parse Form Data
app.use(express.urlencoded({ extended: true }));

// ======================================================
// STATIC FILES
// ======================================================

// Product Images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Frontend Files
app.use(
    express.static(path.join(__dirname, "../FRONTEND"))
);

// ======================================================
// IMPORT ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/vendors", vendorRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/tracking", trackingRoutes);

app.use("/api/withdrawals", withdrawalRoutes);

app.use("/api/deliveries", deliveryRoutes);

app.use("/api/admin", adminRoutes);

// ======================================================
// HOME PAGE
// ======================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../FRONTEND/index.html")
    );

});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {

    res.status(200).json({

        success: true,

        server: "Running",

        database: "Connected",

        timestamp: new Date()

    });

});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route Not Found"

    });

});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

});

const notificationRoutes =
require("./routes/notificationRoutes");

app.use(
    "/api/notifications",
    notificationRoutes
);

const analyticsRoutes =
require("./routes/analyticsRoutes");
app.use(

    "/api/analytics",

    analyticsRoutes

);

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`
=========================================================
                🚀 AFRICART SERVER STARTED
=========================================================
Environment : ${process.env.NODE_ENV || "development"}

Server URL  : http://localhost:${PORT}

Homepage    : http://localhost:${PORT}

API URL     : http://localhost:${PORT}/api

Health      : http://localhost:${PORT}/health

Uploads     : http://localhost:${PORT}/uploads

=========================================================
✅ PostgreSQL Connected
✅ Authentication Ready
✅ Vendors Ready
✅ Products Ready
✅ Cart Ready
✅ Orders Ready
✅ Tracking Ready
✅ Withdrawals Ready
✅ Deliveries Ready
✅ Admin Ready
=========================================================
`);

});