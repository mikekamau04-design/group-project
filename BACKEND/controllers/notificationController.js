// ======================================================
// NOTIFICATION CONTROLLER
// ======================================================

const db = require("../config/db");


// ======================================================
// GET MY NOTIFICATIONS
// ======================================================

exports.getMyNotifications = async (req, res) => {

    try {

        const result = await db.query(

            `
            SELECT *

            FROM notifications

            WHERE user_id=$1

            ORDER BY created_at DESC
            `,

            [

                req.user.id

            ]

        );

        res.json({

            success: true,

            notifications: result.rows

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
// MARK AS READ
// ======================================================

exports.markAsRead = async (req, res) => {

    try {

        await db.query(

            `
            UPDATE notifications

            SET is_read=TRUE

            WHERE id=$1

            AND user_id=$2
            `,

            [

                req.params.id,

                req.user.id

            ]

        );

        res.json({

            success: true,

            message: "Notification marked as read."

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
// CREATE NOTIFICATION
// ======================================================

exports.createNotification = async (

    userId,

    title,

    message,

    type = "general"

) => {

    try {

        await db.query(

            `
            INSERT INTO notifications
            (

                user_id,

                title,

                message,

                type

            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )
            `,

            [

                userId,

                title,

                message,

                type

            ]

        );

    }

    catch (error) {

        console.log(

            "Notification Error:",

            error.message

        );

    }

};


// ======================================================
// DELETE NOTIFICATION
// ======================================================

exports.deleteNotification = async (req, res) => {

    try {

        await db.query(

            `
            DELETE FROM notifications

            WHERE id=$1

            AND user_id=$2
            `,

            [

                req.params.id,

                req.user.id

            ]

        );

        res.json({

            success: true,

            message: "Notification deleted."

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
// MARK ALL AS READ
// ======================================================

exports.markAllAsRead = async (req, res) => {

    try {

        await db.query(

            `
            UPDATE notifications

            SET is_read=TRUE

            WHERE user_id=$1
            `,

            [

                req.user.id

            ]

        );

        res.json({

            success: true,

            message: "All notifications marked as read."

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