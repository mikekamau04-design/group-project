// ======================================================
// TRACKING CONTROLLER
// ======================================================

const db = require("../config/db");

// ======================================================
// ADD TRACKING UPDATE (ADMIN)
// ======================================================

exports.addTracking = async (req, res) => {

    try {

        const orderId = req.params.id;

        const {
            status,
            description,
            location
        } = req.body;

        // Check order exists
        const check = await db.query(
            "SELECT * FROM orders WHERE id=$1",
            [orderId]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        // Insert tracking record
        const tracking = await db.query(
            `
            INSERT INTO order_tracking
            (
                order_id,
                status,
                description,
                location
            )
            VALUES
            ($1,$2,$3,$4)
            RETURNING *
            `,
            [
                orderId,
                status,
                description,
                location
            ]
        );

        // Update current order status
        await db.query(
            `
            UPDATE orders
            SET delivery_status=$1
            WHERE id=$2
            `,
            [
                status,
                orderId
            ]
        );

        res.status(201).json({

            success: true,
            message: "Tracking updated successfully.",

            tracking: tracking.rows[0]

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};

// ======================================================
// GET ORDER TRACKING
// ======================================================

exports.getTracking = async (req, res) => {

    try {

        const orderId = req.params.id;

        // ==========================================
        // GET ORDER + CUSTOMER INFO
        // ==========================================

        const orderResult = await db.query(
            `
            SELECT
                o.*,
                u.fullname AS customer_name,
                u.email AS customer_email
            FROM orders o
            JOIN users u
                ON o.user_id = u.id
            WHERE o.id = $1
            `,
            [orderId]
        );

        if (orderResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        const order = orderResult.rows[0];

        // ==========================================
        // CUSTOMER CAN ONLY TRACK THEIR OWN ORDER
        // ==========================================

        if (
            req.user.role === "customer" &&
            order.user_id !== req.user.id
        ) {

            return res.status(403).json({
                success: false,
                message: "Access denied."
            });

        }

        // ==========================================
        // GET ORDER ITEMS
        // ==========================================

        const items = await db.query(
            `
            SELECT
                oi.quantity,
                oi.price,
                p.name,
                p.image
            FROM order_items oi
            JOIN products p
                ON oi.product_id = p.id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [orderId]
        );

        // ==========================================
        // GET TRACKING HISTORY
        // ==========================================

        const tracking = await db.query(
            `
            SELECT *
            FROM order_tracking
            WHERE order_id=$1
            ORDER BY created_at ASC
            `,
            [orderId]
        );

        const latestTracking =
            tracking.rows[tracking.rows.length - 1] || {};

        // ==========================================
        // RESPONSE (shape expected by track-order.html)
        // ==========================================

        res.json({

            success: true,

            order: {
                id: order.id,
                created_at: order.created_at,
                status: order.status,
                customer_name: order.customer_name,
                phone: order.phone,
                address: order.delivery_location,
                courier: latestTracking.location || null,
                estimated_delivery: order.estimated_delivery || null,
                items: items.rows
            },

            history: tracking.rows

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};