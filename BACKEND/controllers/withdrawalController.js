// ======================================================
// WITHDRAWAL CONTROLLER
// PART 1
// ======================================================

const db = require("../config/db");
const { sendWithdrawalStatusEmail } = require("../utils/mailer");


// ======================================================
// GET VENDOR BALANCE
// ======================================================

exports.getBalance = async (req, res) => {

    try {

        const vendorId = req.user.id;

        const earnings = await db.query(

            `
            SELECT
            COALESCE(SUM(oi.quantity * oi.price),0) AS total
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.vendor_id=$1
            AND o.status='Delivered'
            `,

            [vendorId]

        );

        const withdrawn = await db.query(

            `
            SELECT
            COALESCE(SUM(amount),0) AS total
            FROM withdrawals
            WHERE vendor_id=$1
            AND status='approved'
            `,

            [vendorId]

        );

        const balance =
            Number(earnings.rows[0].total) -
            Number(withdrawn.rows[0].total);

        res.json({

            success: true,

            balance

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};



// ======================================================
// REQUEST WITHDRAWAL
// ======================================================

exports.requestWithdrawal = async (req, res) => {

    try {

        const vendorId = req.user.id;

        const { amount } = req.body;

        if (!amount || amount <= 0) {

            return res.status(400).json({

                success: false,

                message: "Invalid amount."

            });

        }

        // Check total earnings

        const earnings = await db.query(

            `
            SELECT
            COALESCE(SUM(oi.quantity * oi.price),0) AS total
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.vendor_id=$1
            AND o.status='Delivered'
            `,

            [vendorId]

        );

        // Check approved withdrawals

        const withdrawn = await db.query(

            `
            SELECT
            COALESCE(SUM(amount),0) AS total
            FROM withdrawals
            WHERE vendor_id=$1
            AND status='approved'
            `,

            [vendorId]

        );

        const balance =
            Number(earnings.rows[0].total) -
            Number(withdrawn.rows[0].total);

        if (amount > balance) {

            return res.status(400).json({

                success: false,

                message: "Insufficient balance."

            });

        }

        // Check existing pending request

        const pending = await db.query(

            `
            SELECT id
            FROM withdrawals
            WHERE vendor_id=$1
            AND status='pending'
            `,

            [vendorId]

        );

        if (pending.rows.length > 0) {

            return res.status(400).json({

                success: false,

                message: "You already have a pending withdrawal."

            });

        }

        await db.query(

            `
            INSERT INTO withdrawals
            (

                vendor_id,

                amount,

                status

            )

            VALUES

            (

                $1,

                $2,

                'pending'

            )

            `,

            [

                vendorId,

                amount

            ]

        );

        res.json({

            success: true,

            message: "Withdrawal request submitted."

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================================
// GET VENDOR WITHDRAWAL HISTORY
// ======================================================

exports.getMyWithdrawals = async (req, res) => {

    try {

        const vendorId = req.user.id;

        const result = await db.query(

            `
            SELECT *
            FROM withdrawals
            WHERE vendor_id=$1
            ORDER BY requested_at DESC
            `,

            [vendorId]

        );

        res.json({

            success: true,

            withdrawals: result.rows

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// ADMIN GET ALL WITHDRAWALS
// ======================================================

exports.getAllWithdrawals = async (req, res) => {

    try {

        const result = await db.query(

            `
            SELECT
                w.*,
                u.fullname,
                u.email
            FROM withdrawals w
            JOIN users u
            ON w.vendor_id=u.id
            ORDER BY requested_at DESC
            `

        );

        res.json({

            success: true,

            withdrawals: result.rows

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ======================================================
// APPROVE WITHDRAWAL
// ======================================================

exports.approveWithdrawal = async (req, res) => {

    try {

        const withdrawalId = req.params.id;

        const adminId = req.user.id;

        const {

            notes,

            transaction_code

        } = req.body;

        // Check if request exists

        const check = await db.query(

            `
            SELECT w.*, u.fullname, u.email

            FROM withdrawals w
            JOIN users u ON w.vendor_id = u.id

            WHERE w.id=$1
            `,

            [

                withdrawalId

            ]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Withdrawal not found."

            });

        }

        if (check.rows[0].status !== "pending") {

            return res.status(400).json({

                success: false,

                message: "Withdrawal already processed."

            });

        }

        // Use the admin-supplied transaction code (e.g. MPESA code) if given,
        // otherwise fall back to a generated reference.

        const transactionCode =
            (transaction_code && transaction_code.trim())
                ? transaction_code.trim()
                : "AFRI-" + Date.now();

        await db.query(

            `
            UPDATE withdrawals

            SET

            status='approved',

            approved_at=NOW(),

            approved_by=$1,

            transaction_code=$2,

            notes=$3

            WHERE id=$4
            `,

            [

                adminId,

                transactionCode,

                notes || null,

                withdrawalId

            ]

        );

        sendWithdrawalStatusEmail({
            to: check.rows[0].email,
            customerName: check.rows[0].fullname,
            amount: check.rows[0].amount,
            status: "approved",
            transactionCode,
            notes
        });

        res.json({

            success: true,

            message: "Withdrawal approved.",

            transactionCode

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// REJECT WITHDRAWAL
// ======================================================

exports.rejectWithdrawal = async (req, res) => {

    try {

        const id = req.params.id;

        const {

            notes

        } = req.body;

        const check = await db.query(

            `
            SELECT w.*, u.fullname, u.email

            FROM withdrawals w
            JOIN users u ON w.vendor_id = u.id

            WHERE w.id=$1
            `,

            [

                id

            ]

        );

        if (check.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Withdrawal not found."

            });

        }

        if (check.rows[0].status !== "pending") {

            return res.status(400).json({

                success: false,

                message: "Already processed."

            });

        }

        await db.query(

            `
            UPDATE withdrawals

            SET

            status='rejected',

            notes=$1

            WHERE id=$2
            `,

            [

                notes || null,

                id

            ]

        );

        sendWithdrawalStatusEmail({
            to: check.rows[0].email,
            customerName: check.rows[0].fullname,
            amount: check.rows[0].amount,
            status: "rejected",
            notes
        });

        res.json({

            success: true,

            message: "Withdrawal rejected."

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};