
// ======================================================
// VENDOR CONTROLLER
// ======================================================

const db = require("../config/db");

// ======================================================
// DASHBOARD STATISTICS
// ======================================================

exports.getDashboard = async (req, res) => {

    try {

        const vendorId = req.user.id;

        // =====================================
        // TOTAL PRODUCTS
        // =====================================

        const products = await db.query(

            `
            SELECT COUNT(*) AS total
            FROM products
            WHERE vendor_id = $1
            `,

            [vendorId]

        );

        // =====================================
        // TOTAL ORDERS
        // =====================================

        const orders = await db.query(

            `
            SELECT COUNT(*) AS total
            FROM order_items
            WHERE vendor_id = $1
            `,

            [vendorId]

        );

        // =====================================
        // TOTAL SALES
        // =====================================

        const sales = await db.query(

            `
            SELECT
                COALESCE(
                    SUM(quantity * price),
                    0
                ) AS total
            FROM order_items
            WHERE vendor_id = $1
            `,

            [vendorId]

        );

        // =====================================
        // PENDING ORDERS
        // =====================================

        const pending = await db.query(

            `
            SELECT COUNT(*) AS total
            FROM order_items oi
            JOIN orders o
            ON oi.order_id = o.id
            WHERE
                oi.vendor_id = $1
                AND o.status = 'Pending'
            `,

            [vendorId]

        );

        res.json({

            success: true,

            stats: {

                totalProducts:
                    Number(products.rows[0].total),

                totalOrders:
                    Number(orders.rows[0].total),

                totalSales:
                    Number(sales.rows[0].total),

                pendingOrders:
                    Number(pending.rows[0].total)

            }

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// GET VENDOR PROFILE
// ======================================================

exports.getVendorProfile = async (req, res) => {

    try{

        const vendor = await db.query(

            `
            SELECT
                id,
                fullname,
                email,
                phone,
                role,
                image,
                created_at
            FROM users
            WHERE id = $1
            `,

            [req.user.id]

        );

        if(vendor.rows.length === 0){

            return res.status(404).json({

                success:false,

                message:"Vendor not found."

            });

        }

        res.json({

            success:true,

            vendor:vendor.rows[0]

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// MONTHLY SALES
// ======================================================

exports.getMonthlySales = async (req, res) => {

    try{

        const result = await db.query(

            `
            SELECT

                DATE_TRUNC(
                    'month',
                    o.created_at
                ) AS month,

                SUM(
                    oi.quantity * oi.price
                ) AS total

            FROM order_items oi

            JOIN orders o

            ON oi.order_id = o.id

            WHERE oi.vendor_id = $1

            GROUP BY month

            ORDER BY month
            `,

            [req.user.id]

        );

        res.json({

            success:true,

            sales:result.rows

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// RECENT ORDERS
// ======================================================

exports.getRecentOrders = async (req, res) => {

    try{

        const result = await db.query(

            `
            SELECT

                o.id,

                o.status,

                o.created_at,

                u.fullname AS customer,

                p.name,

                oi.quantity,

                oi.price

            FROM order_items oi

            JOIN orders o

            ON oi.order_id = o.id

            JOIN users u

            ON o.user_id = u.id

            JOIN products p

            ON oi.product_id = p.id

            WHERE oi.vendor_id = $1

            ORDER BY o.created_at DESC

            LIMIT 10
            `,

            [req.user.id]

        );

        res.json({

            success:true,

            orders:result.rows

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// UPDATE VENDOR PROFILE
// ======================================================

exports.updateVendorProfile = async (req, res) => {

    try{

        const vendorId = req.user.id;

        const{

            fullname,

            phone

        } = req.body;

        const result = await db.query(

            `
            UPDATE users
            SET

                fullname = $1,

                phone = $2

            WHERE id = $3

            RETURNING
                id,
                fullname,
                email,
                phone,
                role,
                image
            `,

            [

                fullname,

                phone,

                vendorId

            ]

        );

        res.json({

            success:true,

            message:"Profile updated successfully.",

            vendor:result.rows[0]

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// VENDOR EARNINGS
// ======================================================

exports.getVendorEarnings = async (req, res) => {

    try{

        const vendorId = req.user.id;

        const result = await db.query(

            `
            SELECT

                COALESCE(

                    SUM(

                        quantity * price

                    ),

                    0

                ) AS earnings

            FROM order_items

            WHERE vendor_id = $1
            `,

            [vendorId]

        );

        res.json({

            success:true,

            earnings:Number(result.rows[0].earnings)

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// DASHBOARD SUMMARY
// ======================================================

exports.getDashboardSummary = async (req, res) => {

    try{

        const vendorId = req.user.id;

        const products = await db.query(

            "SELECT COUNT(*) total FROM products WHERE vendor_id=$1",

            [vendorId]

        );

        const orders = await db.query(

            "SELECT COUNT(*) total FROM order_items WHERE vendor_id=$1",

            [vendorId]

        );

        const earnings = await db.query(

            `
            SELECT

                COALESCE(

                    SUM(quantity * price),

                    0

                ) total

            FROM order_items

            WHERE vendor_id=$1
            `,

            [vendorId]

        );

        res.json({

            success:true,

            summary:{

                products:Number(products.rows[0].total),

                orders:Number(orders.rows[0].total),

                earnings:Number(earnings.rows[0].total)

            }

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};