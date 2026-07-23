// ======================================================
// PRODUCT CONTROLLER
// ======================================================

const db = require("../config/db");
const fs = require("fs");
const path = require("path");

// ======================================================
// ADD PRODUCT
// ======================================================

exports.addProduct = async (req, res) => {
    try {
        const { name, description, category, price, stock } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: "Name and price are required."
            });
        }

        let image = null;
        if (req.file) {
            image = req.file.filename;
        }

        const result = await db.query(
            `INSERT INTO products
             (vendor_id, name, description, category, price, stock, image, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Active')
             RETURNING *`,
            [req.user.id, name, description, category, price, stock || 0, image]
        );

        res.status(201).json({
            success: true,
            message: "Product added successfully.",
            product: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// GET ALL PRODUCTS
// ======================================================

exports.getProducts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, u.fullname AS vendor
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            WHERE COALESCE(p.status, 'Active') = 'Active'
            ORDER BY p.id DESC
        `);

        res.json({ success: true, products: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// GET MY PRODUCTS
// ======================================================

exports.getMyProducts = async (req, res) => {
    try {
        const products = await db.query(
            `SELECT * FROM products WHERE vendor_id = $1 ORDER BY id DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            total: products.rows.length,
            products: products.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// UPDATE PRODUCT
// ======================================================

exports.updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, category, price, stock } = req.body;

        const check = await db.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = check.rows[0];

        if (product.vendor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own products."
            });
        }

        let image = product.image;
        if (req.file) {
            image = req.file.filename;
        }

        const updated = await db.query(
            `UPDATE products
             SET name=$1, description=$2, category=$3, price=$4, stock=$5, image=$6
             WHERE id=$7
             RETURNING *`,
            [name, description, category, price, stock, image, id]
        );

        res.json({
            success: true,
            message: "Product updated successfully.",
            product: updated.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// DELETE PRODUCT
// ======================================================

exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const check = await db.query(
            "SELECT * FROM products WHERE id=$1",
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = check.rows[0];

        if (product.vendor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own product."
            });
        }

        // Remove any pending cart entries for this product first — those are
        // not historical records, so it's safe to clear them before deleting.
        await db.query("DELETE FROM cart WHERE product_id=$1", [id]);

        try {
            await db.query("DELETE FROM products WHERE id=$1", [id]);

            if (product.image) {
                const imagePath = path.join(
                    __dirname,
                    "../uploads/products",
                    product.image
                );

                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            return res.json({
                success: true,
                message: "Product deleted successfully."
            });

        } catch (deleteError) {
            // Postgres foreign key violation: the product is referenced by
            // existing order(s), so it can't be removed without breaking
            // order history. Deactivate it instead so it disappears from
            // the storefront but past orders still reference a valid product.
            if (deleteError.code === "23503") {
                await db.query(
                    "UPDATE products SET status='Inactive' WHERE id=$1",
                    [id]
                );

                return res.json({
                    success: true,
                    deactivated: true,
                    message: "This product has existing orders, so it can't be permanently deleted. It has been deactivated and hidden from customers instead."
                });
            }

            throw deleteError;
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// TOGGLE PRODUCT ACTIVE / INACTIVE
// ======================================================

exports.toggleProductStatus = async (req, res) => {
    try {
        const id = req.params.id;

        const check = await db.query(
            "SELECT * FROM products WHERE id=$1",
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = check.rows[0];

        if (product.vendor_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own products."
            });
        }

        const newStatus =
            (product.status || "Active").toLowerCase() === "active"
                ? "Inactive"
                : "Active";

        const updated = await db.query(
            "UPDATE products SET status=$1 WHERE id=$2 RETURNING *",
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Product marked as ${newStatus}.`,
            product: updated.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ======================================================
// GET SINGLE PRODUCT
// ======================================================

exports.getProductById = async (req, res) => {

    try {

        const id = req.params.id;

        const result = await db.query(
            `
            SELECT
                p.*,
                u.fullname AS vendor
            FROM products p
            JOIN users u
            ON p.vendor_id = u.id
            WHERE p.id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        res.json({

            success: true,

            product: result.rows[0]

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
// SEARCH PRODUCTS
// ======================================================

exports.searchProducts = async (req, res) => {

    try {

        const keyword = req.query.q || "";

        const result = await db.query(
            `SELECT
                p.*,
                u.fullname AS vendor
             FROM products p
             JOIN users u
             ON p.vendor_id=u.id
             WHERE
                COALESCE(p.status, 'Active') = 'Active'
                AND (
                    LOWER(p.name) LIKE LOWER($1)
                    OR LOWER(p.description) LIKE LOWER($1)
                )
             ORDER BY p.id DESC`,
            [`%${keyword}%`]
        );

        res.json({
            success: true,
            total: result.rows.length,
            products: result.rows
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================================================
// PRODUCTS BY CATEGORY
// ======================================================

exports.getProductsByCategory = async (req, res) => {

    try {

        const category = req.params.category;

        const result = await db.query(
            `SELECT
                p.*,
                u.fullname AS vendor
             FROM products p
             JOIN users u
             ON p.vendor_id=u.id
             WHERE
                COALESCE(p.status, 'Active') = 'Active'
                AND LOWER(category)=LOWER($1)
             ORDER BY p.id DESC`,
            [category]
        );

        res.json({
            success: true,
            total: result.rows.length,
            products: result.rows
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================================================
// PAGINATED PRODUCTS
// ======================================================

exports.getProductsPaginated = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const offset = (page - 1) * limit;

        const total = await db.query(
            "SELECT COUNT(*) FROM products WHERE COALESCE(status, 'Active') = 'Active'"
        );

        const result = await db.query(
            `SELECT
                p.*,
                u.fullname AS vendor
             FROM products p
             JOIN users u
             ON p.vendor_id=u.id
             WHERE COALESCE(p.status, 'Active') = 'Active'
             ORDER BY p.id DESC
             LIMIT $1
             OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            page,
            limit,
            total: Number(total.rows[0].count),
            products: result.rows
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};