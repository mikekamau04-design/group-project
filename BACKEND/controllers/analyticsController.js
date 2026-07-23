// ======================================================
// AFRICART ANALYTICS CONTROLLER
// ======================================================

const db = require("../config/db");


// ======================================================
// ADMIN DASHBOARD SUMMARY
// ======================================================

exports.getDashboardSummary = async (req, res) => {

    try {

        const users = await db.query(

            "SELECT COUNT(*) FROM users"

        );

        const vendors = await db.query(

            "SELECT COUNT(*) FROM vendors"

        );

        const products = await db.query(

            "SELECT COUNT(*) FROM products"

        );

        const orders = await db.query(

            "SELECT COUNT(*) FROM orders"

        );

        const revenue = await db.query(

            `
            SELECT

            COALESCE(SUM(total),0) AS revenue

            FROM orders

            WHERE status='delivered'
            `

        );

        res.json({

            success: true,

            summary: {

                users:

                    Number(users.rows[0].count),

                vendors:

                    Number(vendors.rows[0].count),

                products:

                    Number(products.rows[0].count),

                orders:

                    Number(orders.rows[0].count),

                revenue:

                    Number(revenue.rows[0].revenue)

            }

        });

    }

    catch(error){

        console.log(error);

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

    try {

        const result = await db.query(

            `
            SELECT

                TO_CHAR(created_at,'Mon') AS month,

                COUNT(*) AS orders,

                COALESCE(SUM(total),0) AS revenue

            FROM orders

            WHERE status='delivered'

            GROUP BY

                DATE_TRUNC('month',created_at),

                TO_CHAR(created_at,'Mon')

            ORDER BY

                DATE_TRUNC('month',created_at)
            `

        );

        res.json({

            success: true,

            sales: result.rows

        });

    }

    catch(error){

        console.log(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};
// ======================================================
// BEST SELLING PRODUCTS
// ======================================================

exports.getBestSellingProducts = async (req, res) => {

    try {

        const result = await db.query(

            `
            SELECT

                p.id,

                p.name,

                COUNT(oi.product_id) AS total_sold

            FROM order_items oi

            JOIN products p

            ON oi.product_id = p.id

            GROUP BY

                p.id,

                p.name

            ORDER BY

                total_sold DESC

            LIMIT 10
            `

        );

        res.json({

            success:true,

            products:result.rows

        });

    }

    catch(error){

        console.log(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};