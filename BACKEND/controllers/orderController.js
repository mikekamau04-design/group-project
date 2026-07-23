// ======================================================
// ORDER CONTROLLER
// ======================================================

const db = require("../config/db");
const { sendDeliveryEmail } = require("../utils/mailer");

// ======================================================
// CHECKOUT
// ======================================================

exports.checkout = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const userId = req.user.id;

        const {
            delivery_location,
            phone,
            delivery_fee
        } = req.body;

        // Get Cart Items
        const cart = await client.query(
            `
            SELECT
                c.quantity,
                p.id,
                p.vendor_id,
                p.price,
                p.stock,
                p.name
            FROM cart c
            JOIN products p
                ON c.product_id = p.id
            WHERE c.user_id = $1
            `,
            [userId]
        );

        if (cart.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({

                success: false,
                message: "Your cart is empty."

            });

        }

        let total = 0;

        for (const item of cart.rows) {

            if (item.quantity > item.stock) {

                await client.query("ROLLBACK");

                return res.status(400).json({

                    success: false,
                    message: `${item.name} has only ${item.stock} left in stock.`

                });

            }

            total += Number(item.price) * item.quantity;

        }

        // Create Order
        const order = await client.query(
            `
            INSERT INTO orders
            (
                user_id,
                total_amount,
                status,
                payment_status,
                delivery_status,
                phone,
                delivery_location,
                delivery_fee
            )
            VALUES
            (
                $1,
                $2,
                'Pending',
                'Pending',
                'Pending',
                $3,
                $4,
                $5
            )
            RETURNING *
            `,
            [
                userId,
                total,
                phone || null,
                delivery_location || null,
                delivery_fee || 0
            ]
        );

        const orderId = order.rows[0].id;

        // Save Order Items
        for (const item of cart.rows) {

            await client.query(
                `
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    vendor_id,
                    quantity,
                    price
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    orderId,
                    item.id,
                    item.vendor_id,
                    item.quantity,
                    item.price
                ]
            );

            // Reduce Product Stock
            await client.query(
                `
                UPDATE products
                SET stock = stock - $1
                WHERE id = $2
                `,
                [
                    item.quantity,
                    item.id
                ]
            );

        }

        // Empty Customer Cart
        await client.query(
            `
            DELETE FROM cart
            WHERE user_id = $1
            `,
            [
                userId
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({

            success: true,
            message: "Order placed successfully.",
            order: order.rows[0]

        });

    }

    catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

    finally {

        client.release();

    }

};
// ======================================================
// GET MY ORDERS
// ======================================================

exports.getMyOrders = async (req, res) => {

    try {

        const orders = await db.query(
            `
            SELECT
                *
            FROM orders
            WHERE user_id = $1
            ORDER BY id DESC
            `,
            [
                req.user.id
            ]
        );

        res.json({

            success: true,
            total: orders.rows.length,
            orders: orders.rows

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
// GET ORDER DETAILS
// ======================================================

exports.getOrderDetails = async (req, res) => {

    try {

        const orderId = req.params.id;

        // ==========================================
        // GET ORDER
        // ==========================================

        const orderResult = await db.query(
            `
            SELECT
                *
            FROM orders
            WHERE id = $1
            `,
            [
                orderId
            ]
        );

        if (orderResult.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const order = orderResult.rows[0];

        // ==========================================
        // CUSTOMER CAN ONLY VIEW OWN ORDER
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

                oi.*,

                p.name,

                p.image,

                p.category,

                p.price,

                u.fullname AS vendor_name

            FROM order_items oi

            JOIN products p

                ON oi.product_id = p.id

            JOIN users u

                ON oi.vendor_id = u.id

            WHERE oi.order_id = $1

            ORDER BY oi.id ASC
            `,
            [
                orderId
            ]
        );

        // ==========================================
        // FORMAT IMAGES
        // ==========================================

        items.rows.forEach(item => {

            if (item.image) {

                item.image =
                    "/uploads/products/" + item.image;

            }

        });

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({

            success: true,

            order,

            totalItems: items.rows.length,

            items: items.rows

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
// CANCEL ORDER
// ======================================================

exports.cancelOrder = async (req, res) => {

    const client = await db.connect();

    try {

        await client.query("BEGIN");

        const orderId = req.params.id;

        const orderCheck = await client.query(
            `
            SELECT *
            FROM orders
            WHERE id = $1
            `,
            [
                orderId
            ]
        );

        if (orderCheck.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const order = orderCheck.rows[0];

        // Customer can only cancel own order

        if (order.user_id !== req.user.id) {

            await client.query("ROLLBACK");

            return res.status(403).json({

                success: false,
                message: "Access denied."

            });

        }

        // Only Pending orders can be cancelled

        if (order.status !== "Pending") {

            await client.query("ROLLBACK");

            return res.status(400).json({

                success: false,
                message: "Only pending orders can be cancelled."

            });

        }

        // ==========================================
        // RESTORE PRODUCT STOCK
        // ==========================================

        const items = await client.query(
            `
            SELECT *
            FROM order_items
            WHERE order_id = $1
            `,
            [
                orderId
            ]
        );

        for (const item of items.rows) {

            await client.query(
                `
                UPDATE products
                SET stock = stock + $1
                WHERE id = $2
                `,
                [
                    item.quantity,
                    item.product_id
                ]
            );

        }

        // ==========================================
        // UPDATE ORDER STATUS
        // ==========================================

        await client.query(
            `
            UPDATE orders
            SET
                status = 'Cancelled',
                delivery_status = 'Cancelled'
            WHERE id = $1
            `,
            [
                orderId
            ]
        );

        await client.query("COMMIT");

        res.json({

            success: true,
            message: "Order cancelled successfully."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

    finally {

        client.release();

    }

};

// ======================================================
// GET VENDOR ORDERS
// ======================================================

exports.getVendorOrders = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT

                o.id,

                o.status,

                o.payment_status,

                o.delivery_status,

                o.total_amount,

                o.created_at,

                u.fullname AS customer_name,

                u.phone,

                p.id AS product_id,

                p.name AS product_name,

                p.image,

                oi.quantity,

                oi.price,

                (oi.quantity * oi.price) AS subtotal

            FROM order_items oi

            JOIN orders o
                ON oi.order_id = o.id

            JOIN users u
                ON o.user_id = u.id

            JOIN products p
                ON oi.product_id = p.id

            WHERE oi.vendor_id = $1

            ORDER BY o.created_at DESC
            `,
            [
                req.user.id
            ]
        );

        result.rows.forEach(order => {

            if (order.image) {

                order.image =
                    "/uploads/products/" + order.image;

            }

        });

        res.json({

            success: true,

            total: result.rows.length,

            orders: result.rows

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
// GET ALL ORDERS (ADMIN)
// ======================================================

exports.getAllOrders = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT

                o.id,

                o.user_id,

                o.total_amount,

                o.status,

                o.payment_status,

                o.delivery_status,

                o.created_at,

                u.fullname,

                u.email,

                u.phone

            FROM orders o

            JOIN users u

                ON o.user_id = u.id

            ORDER BY o.created_at DESC
            `
        );

        res.json({

            success: true,

            total: result.rows.length,

            orders: result.rows

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
// UPDATE ORDER STATUS (ADMIN)
// ======================================================

exports.updateOrderStatus = async (req, res) => {

    try {

        const orderId = req.params.id;

        const {

            status,

            payment_status,

            delivery_status

        } = req.body;

        const check = await db.query(

            `
            SELECT *
            FROM orders
            WHERE id = $1
            `,

            [

                orderId

            ]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Order not found."

            });

        }

        const updated = await db.query(

            `
            UPDATE orders

            SET

                status = $1,

                payment_status = $2,

                delivery_status = $3

            WHERE id = $4

            RETURNING *
            `,

            [

                status,

                payment_status,

                delivery_status,

                orderId

            ]

        );

        // ==========================================
        // SEND "ORDER DELIVERED" EMAIL IF NEWLY DELIVERED
        // ==========================================

        if (
            delivery_status === "Delivered" &&
            check.rows[0].delivery_status !== "Delivered"
        ) {

            try {

                const customer = await db.query(
                    `
                    SELECT fullname, email
                    FROM users
                    WHERE id = $1
                    `,
                    [updated.rows[0].user_id]
                );

                if (customer.rows.length > 0) {

                    sendDeliveryEmail({
                        to: customer.rows[0].email,
                        customerName: customer.rows[0].fullname,
                        orderNumber: updated.rows[0].id,
                        deliveryDate: new Date().toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        })
                    });

                }

            } catch (emailError) {

                console.error("Delivery email error:", emailError.message);

            }

        }

        res.json({

            success: true,

            message: "Order updated successfully.",

            order: updated.rows[0]

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};// ======================================================
// ACCEPT ORDER (VENDOR)
// ======================================================

exports.acceptOrder = async (req, res) => {

    try {

        const orderId = req.params.id;

        const check = await db.query(
            `
            SELECT
                o.*,
                oi.vendor_id
            FROM orders o
            JOIN order_items oi
                ON o.id = oi.order_id
            WHERE
                o.id = $1
                AND oi.vendor_id = $2
            `,
            [
                orderId,
                req.user.id
            ]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const updated = await db.query(
            `
            UPDATE orders
            SET status='Accepted'
            WHERE id=$1
            RETURNING *
            `,
            [
                orderId
            ]
        );

        res.json({

            success: true,
            message: "Order accepted successfully.",
            order: updated.rows[0]

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
// REJECT ORDER (VENDOR)
// ======================================================

exports.rejectOrder = async (req, res) => {

    try {

        const orderId = req.params.id;

        const check = await db.query(
            `
            SELECT
                o.*,
                oi.vendor_id
            FROM orders o
            JOIN order_items oi
                ON o.id = oi.order_id
            WHERE
                o.id = $1
                AND oi.vendor_id = $2
            `,
            [
                orderId,
                req.user.id
            ]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const updated = await db.query(
            `
            UPDATE orders
            SET status='Rejected'
            WHERE id=$1
            RETURNING *
            `,
            [
                orderId
            ]
        );

        res.json({

            success: true,
            message: "Order rejected successfully.",
            order: updated.rows[0]

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
// SHIP ORDER (VENDOR)
// ======================================================

exports.shipOrder = async (req, res) => {

    try {

        const orderId = req.params.id;

        const check = await db.query(
            `
            SELECT
                o.*,
                oi.vendor_id
            FROM orders o
            JOIN order_items oi
                ON o.id = oi.order_id
            WHERE
                o.id = $1
                AND oi.vendor_id = $2
            `,
            [
                orderId,
                req.user.id
            ]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const updated = await db.query(
            `
            UPDATE orders
            SET
                status='Shipped',
                delivery_status='Shipped'
            WHERE id=$1
            RETURNING *
            `,
            [
                orderId
            ]
        );

        res.json({

            success: true,
            message: "Order shipped successfully.",
            order: updated.rows[0]

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
// DELIVER ORDER (VENDOR)
// ======================================================

exports.deliverOrder = async (req, res) => {

    try {

        const orderId = req.params.id;

        const check = await db.query(
            `
            SELECT
                o.*,
                oi.vendor_id
            FROM orders o
            JOIN order_items oi
                ON o.id = oi.order_id
            WHERE
                o.id = $1
                AND oi.vendor_id = $2
            `,
            [
                orderId,
                req.user.id
            ]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Order not found."

            });

        }

        const updated = await db.query(
            `
            UPDATE orders
            SET
                status='Delivered',
                delivery_status='Delivered'
            WHERE id=$1
            RETURNING *
            `,
            [
                orderId
            ]
        );

        // ==========================================
        // SEND "ORDER DELIVERED" EMAIL TO CUSTOMER
        // ==========================================

        try {

            const customer = await db.query(
                `
                SELECT fullname, email
                FROM users
                WHERE id = $1
                `,
                [updated.rows[0].user_id]
            );

            if (customer.rows.length > 0) {

                sendDeliveryEmail({
                    to: customer.rows[0].email,
                    customerName: customer.rows[0].fullname,
                    orderNumber: updated.rows[0].id,
                    deliveryDate: new Date().toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })
                });

            }

        } catch (emailError) {

            // Never let an email failure block the delivery update
            console.error("Delivery email error:", emailError.message);

        }

        res.json({

            success: true,
            message: "Order marked as delivered.",
            order: updated.rows[0]

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