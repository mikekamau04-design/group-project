// ======================================================
// CART CONTROLLER
// ======================================================

const db = require("../config/db");

// ======================================================
// ADD TO CART
// ======================================================

exports.addToCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const { product_id, quantity } = req.body;

        if (!product_id) {

            return res.status(400).json({

                success: false,

                message: "Product ID is required."

            });

        }

        const qty = quantity || 1;

        // Check if product exists

        const product = await db.query(

            `SELECT * FROM products
             WHERE id = $1`,

            [product_id]

        );

        if (product.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Product not found."

            });

        }

        if (
            (product.rows[0].status || "Active").toLowerCase() !== "active"
        ) {

            return res.status(400).json({

                success: false,

                message: "This product is currently unavailable."

            });

        }

        // Check if already in cart

        const existing = await db.query(

            `SELECT * FROM cart
             WHERE user_id = $1
             AND product_id = $2`,

            [userId, product_id]

        );

        // Update quantity

        if (existing.rows.length > 0) {

            const updated = await db.query(

                `UPDATE cart
                 SET quantity = quantity + $1
                 WHERE user_id = $2
                 AND product_id = $3
                 RETURNING *`,

                [

                    qty,

                    userId,

                    product_id

                ]

            );

            return res.json({

                success: true,

                message: "Cart updated successfully.",

                cart: updated.rows[0]

            });

        }

        // Insert new item

        const inserted = await db.query(

            `INSERT INTO cart
            (
                user_id,
                product_id,
                quantity
            )

            VALUES
            (
                $1,
                $2,
                $3
            )

            RETURNING *`,

            [

                userId,

                product_id,

                qty

            ]

        );

        res.status(201).json({

            success: true,

            message: "Product added to cart.",

            cart: inserted.rows[0]

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
// GET USER CART
// ======================================================

exports.getCart = async (req, res) => {

    try {

        const userId = req.user.id;

        const result = await db.query(

            `
            SELECT

                c.id,

                c.quantity,

                p.id AS product_id,

                p.name,

                p.price,

                p.stock,

                p.image,

                p.category,

                u.fullname AS vendor,

                (c.quantity * p.price) AS subtotal

            FROM cart c

            JOIN products p

                ON c.product_id = p.id

            JOIN users u

                ON p.vendor_id = u.id

            WHERE c.user_id = $1

            ORDER BY c.id DESC
            `,

            [userId]

        );

        let grandTotal = 0;

        result.rows.forEach(item => {

            grandTotal += Number(item.subtotal);

            if (item.image) {

                item.image =
                    "/uploads/products/" + item.image;

            }

        });

        res.json({

            success: true,

            totalItems: result.rows.length,

            grandTotal,

            cart: result.rows

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
// UPDATE CART ITEM
// ======================================================

exports.updateCartItem = async (req, res) => {

    try {

        const userId = req.user.id;

        const cartId = req.params.id;

        const { quantity } = req.body;

        if (!quantity || quantity < 1) {

            return res.status(400).json({

                success: false,

                message: "Quantity must be at least 1."

            });

        }

        const check = await db.query(

            `
            SELECT *
            FROM cart
            WHERE id = $1
            AND user_id = $2
            `,

            [

                cartId,

                userId

            ]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Cart item not found."

            });

        }

        const updated = await db.query(

            `
            UPDATE cart
            SET quantity = $1
            WHERE id = $2
            RETURNING *
            `,

            [

                quantity,

                cartId

            ]

        );

        res.json({

            success: true,

            message: "Cart updated successfully.",

            cart: updated.rows[0]

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
// REMOVE CART ITEM
// ======================================================

exports.removeCartItem = async (req, res) => {

    try {

        const userId = req.user.id;

        const cartId = req.params.id;

        const check = await db.query(

            `
            SELECT *
            FROM cart
            WHERE id = $1
            AND user_id = $2
            `,

            [

                cartId,

                userId

            ]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Cart item not found."

            });

        }

        await db.query(

            `
            DELETE FROM cart
            WHERE id = $1
            `,

            [

                cartId

            ]

        );

        res.json({

            success: true,

            message: "Item removed from cart."

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
// CLEAR CART
// ======================================================

exports.clearCart = async (req, res) => {

    try {

        const userId = req.user.id;

        await db.query(

            `
            DELETE FROM cart
            WHERE user_id = $1
            `,

            [

                userId

            ]

        );

        res.json({

            success: true,

            message: "Cart cleared successfully."

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