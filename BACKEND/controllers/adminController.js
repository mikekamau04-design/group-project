// ======================================================
// AFRICART ADMIN CONTROLLER
// ======================================================

const db = require("../config/db");
const { sendDeliveryEmail } = require("../utils/mailer");

// ======================================================
// DASHBOARD
// ======================================================

exports.getDashboard = async (req, res) => {

    try {

        const users = await db.query(`
            SELECT COUNT(*) total
            FROM users
        `);

        const vendors = await db.query(`
            SELECT COUNT(*) total
            FROM users
            WHERE role='vendor'
        `);

        const customers = await db.query(`
            SELECT COUNT(*) total
            FROM users
            WHERE role='customer'
        `);

        const products = await db.query(`
            SELECT COUNT(*) total
            FROM products
        `);

        const orders = await db.query(`
            SELECT COUNT(*) total
            FROM orders
        `);

        const revenue = await db.query(`
            SELECT
                COALESCE(SUM(total_amount),0) total
            FROM orders
            WHERE status='Delivered'
        `);

        const withdrawals = await db.query(`
            SELECT COUNT(*) total
            FROM withdrawals
            WHERE status='pending'
        `);

        const latestOrders = await db.query(`
            SELECT
                o.id,
                u.fullname AS customer,
                o.total_amount,
                o.status,
                o.created_at
            FROM orders o
            JOIN users u
                ON o.user_id=u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        res.json({

            success:true,

            data:{

                users:Number(users.rows[0].total),

                vendors:Number(vendors.rows[0].total),

                customers:Number(customers.rows[0].total),

                products:Number(products.rows[0].total),

                orders:Number(orders.rows[0].total),

                revenue:Number(revenue.rows[0].total),

                pendingWithdrawals:Number(withdrawals.rows[0].total),

                latestOrders:latestOrders.rows

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
// GET ALL USERS
// ======================================================

exports.getUsers = async (req,res)=>{

    try{

        const result=await db.query(`
            SELECT
                id,
                fullname,
                email,
                role,
                phone,
                is_verified,
                created_at
            FROM users
            ORDER BY id DESC
        `);

        res.json({

            success:true,

            users:result.rows

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ======================================================
// DELETE USER
// ======================================================

exports.deleteUser = async (req,res)=>{

    try{

        await db.query(

            "DELETE FROM users WHERE id=$1",

            [req.params.id]

        );

        res.json({

            success:true,

            message:"User deleted successfully."

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};     
// ======================================================
// GET ALL VENDORS
// ======================================================

exports.getVendors = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                fullname,
                email,
                phone,
                is_verified,
                created_at
            FROM users
            WHERE role='vendor'
            ORDER BY id DESC
        `);

        res.json({

            success:true,

            vendors:result.rows

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
// APPROVE VENDOR
// ======================================================

exports.approveVendor = async (req,res)=>{

    try{

        const vendor=await db.query(

            `
            SELECT id
            FROM users
            WHERE id=$1
            AND role='vendor'
            `,

            [req.params.id]

        );

        if(vendor.rows.length===0){

            return res.status(404).json({

                success:false,

                message:"Vendor not found."

            });

        }

        await db.query(

            `
            UPDATE users
            SET is_verified=true
            WHERE id=$1
            `,

            [req.params.id]

        );

        res.json({

            success:true,

            message:"Vendor approved successfully."

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
// DELETE VENDOR
// ======================================================

exports.deleteVendor = async (req,res)=>{

    try{

        await db.query(

            `
            DELETE FROM users
            WHERE id=$1
            AND role='vendor'
            `,

            [req.params.id]

        );

        res.json({

            success:true,

            message:"Vendor deleted successfully."

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
// GET ALL PRODUCTS
// ======================================================

exports.getProducts = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                p.id,
                p.name,
                p.category,
                p.price,
                p.stock,
                p.status,
                p.image,
                u.fullname AS vendor
            FROM products p
            JOIN users u
                ON p.vendor_id = u.id
            ORDER BY p.id DESC
        `);

        res.json({

            success: true,

            products: result.rows

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
// DELETE PRODUCT
// ======================================================

exports.deleteProduct = async (req, res) => {

    try {

        const check = await db.query(

            "SELECT id FROM products WHERE id=$1",

            [req.params.id]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Product not found."

            });

        }

        await db.query(
            "DELETE FROM cart WHERE product_id=$1",
            [req.params.id]
        );

        try {

            await db.query(
                "DELETE FROM products WHERE id=$1",
                [req.params.id]
            );

            return res.json({
                success: true,
                message: "Product deleted successfully."
            });

        } catch (deleteError) {

            // Existing order(s) reference this product, so it can't be
            // permanently removed. Deactivate it instead.
            if (deleteError.code === "23503") {

                await db.query(
                    "UPDATE products SET status='Inactive' WHERE id=$1",
                    [req.params.id]
                );

                return res.json({
                    success: true,
                    deactivated: true,
                    message: "This product has existing orders, so it was deactivated instead of deleted."
                });
            }

            throw deleteError;
        }

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
// TOGGLE PRODUCT ACTIVE / INACTIVE (ADMIN)
// ======================================================

exports.toggleProductStatus = async (req, res) => {

    try {

        const check = await db.query(
            "SELECT * FROM products WHERE id=$1",
            [req.params.id]
        );

        if (check.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        const product = check.rows[0];

        const newStatus =
            (product.status || "Active").toLowerCase() === "active"
                ? "Inactive"
                : "Active";

        const updated = await db.query(
            "UPDATE products SET status=$1 WHERE id=$2 RETURNING *",
            [newStatus, req.params.id]
        );

        res.json({
            success: true,
            message: `Product marked as ${newStatus}.`,
            product: updated.rows[0]
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

exports.getOrders = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                o.id,
                o.total_amount,
                o.status,
                o.payment_status,
                o.delivery_status,
                o.created_at,

                u.id AS customer_id,
                u.fullname,
                u.email,
                u.phone

            FROM orders o

            JOIN users u
                ON o.user_id = u.id

            ORDER BY o.created_at DESC
        `);

        res.json({

            success: true,

            total: result.rows.length,

            orders: result.rows

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
// UPDATE ORDER STATUS (ADMIN)
// ======================================================

exports.updateOrderStatus = async (req,res)=>{

    try{

        const id=req.params.id;

        const{

            status,

            payment_status,

            delivery_status

        }=req.body;

        const check=await db.query(

            `
            SELECT id, delivery_status
            FROM orders
            WHERE id=$1
            `,

            [id]

        );

        if(check.rows.length===0){

            return res.status(404).json({

                success:false,

                message:"Order not found."

            });

        }

        const updated=await db.query(

            `
            UPDATE orders

            SET

                status=$1,

                payment_status=$2,

                delivery_status=$3

            WHERE id=$4

            RETURNING *
            `,

            [

                status,

                payment_status,

                delivery_status,

                id

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

            success:true,

            message:"Order updated successfully.",

            order:updated.rows[0]

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
// Withdrawal management now lives entirely in withdrawalController.js
// (mounted at /api/withdrawals/admin, /approve/:id, /reject/:id). This
// avoids having two duplicated, drifting copies of the same logic —
// the versions that used to live here were missing the pending-status
// guard and never set a transaction code.

// ======================================================
// ADMIN PROFILE
// ======================================================

exports.getProfile = async (req, res) => {

    try {

        const result = await db.query(
            `
            SELECT
                id,
                fullname,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = $1
            `,
            [req.user.id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Admin not found."
            });

        }

        res.json({
            success: true,
            admin: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ======================================================
// UPDATE ADMIN PROFILE
// ======================================================

exports.updateProfile = async (req, res) => {

    try {

        const {
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
                role
            `,
            [
                fullname,
                phone,
                req.user.id
            ]
        );

        res.json({

            success: true,

            message: "Profile updated successfully.",

            admin: result.rows[0]

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};