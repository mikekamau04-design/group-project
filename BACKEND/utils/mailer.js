// ======================================================
// MAILER UTILITY (Nodemailer)
// Handles all outgoing transactional emails
// ======================================================

const nodemailer = require("nodemailer");

// ======================================================
// COMPANY DETAILS
// (edit these if your business info changes)
// ======================================================

const COMPANY_NAME = "AFRICART";
const COMPANY_EMAIL = process.env.EMAIL_USER;
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || "https://africart.africa";

// ======================================================
// TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection on startup (does not crash the app if it fails)
transporter.verify((error) => {
    if (error) {
        console.log("⚠️  Email service not ready:", error.message);
    } else {
        console.log("✅ Email service ready (Nodemailer/Gmail)");
    }
});

// ======================================================
// SHARED SEND FUNCTION
// ======================================================

async function sendMail({ to, subject, html }) {

    try {

        if (!to) {
            console.log("⚠️  sendMail skipped: no recipient email provided");
            return { success: false, message: "No recipient email" };
        }

        const info = await transporter.sendMail({
            from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log("📧 Email sent:", subject, "->", to, "-", info.messageId);

        return { success: true, messageId: info.messageId };

    } catch (error) {

        // Emails should never crash the request that triggered them
        console.error("❌ Email send failed:", error.message);

        return { success: false, message: error.message };

    }

}

// ======================================================
// WELCOME / REGISTRATION EMAIL
// ======================================================

function welcomeEmailHtml(customerName) {

    return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6;">
        <p>Dear ${customerName},</p>

        <p>Welcome to <strong>${COMPANY_NAME}</strong>!</p>

        <p>Thank you for creating an account with us. We're excited to have you as part of our community.</p>

        <p>With your account, you can:</p>

        <ul>
            <li>Browse our products.</li>
            <li>Place and track your orders.</li>
            <li>Receive updates on your purchases.</li>
            <li>Enjoy exclusive offers and promotions.</li>
        </ul>

        <p>If you have any questions or need assistance, our support team is always ready to help.</p>

        <p>Thank you for choosing <strong>${COMPANY_NAME}</strong>. We look forward to serving you.</p>

        <p>
            Best regards,<br>
            <strong>${COMPANY_NAME}</strong><br>
            Customer Support<br>
            ${COMPANY_EMAIL}<br>
            ${COMPANY_WEBSITE}
        </p>
    </div>
    `;

}

async function sendWelcomeEmail({ to, customerName }) {

    return sendMail({
        to,
        subject: `Welcome to ${COMPANY_NAME}!`,
        html: welcomeEmailHtml(customerName)
    });

}

// ======================================================
// EMAIL VERIFICATION CODE
// ======================================================

function verificationEmailHtml({ customerName, code }) {

    return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6;">
        <p>Dear ${customerName},</p>

        <p>Thanks for signing up with <strong>${COMPANY_NAME}</strong>. Please confirm it's really you by entering the verification code below.</p>

        <p style="text-align:center; margin: 30px 0;">
            <span style="display:inline-block; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #0b8f4d; background: #f2f8f5; padding: 14px 28px; border-radius: 10px;">
                ${code}
            </span>
        </p>

        <p>This code expires in 15 minutes. If you didn't create an account with us, you can safely ignore this email.</p>

        <p>
            Best regards,<br>
            <strong>${COMPANY_NAME}</strong><br>
            Customer Support<br>
            ${COMPANY_EMAIL}<br>
            ${COMPANY_WEBSITE}
        </p>
    </div>
    `;

}

async function sendVerificationEmail({ to, customerName, code }) {

    return sendMail({
        to,
        subject: `Your ${COMPANY_NAME} verification code`,
        html: verificationEmailHtml({ customerName, code })
    });

}

// ======================================================
// WITHDRAWAL STATUS EMAIL
// ======================================================

function withdrawalStatusEmailHtml({ customerName, amount, status, transactionCode, notes }) {

    const isApproved = status === "approved";

    return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6;">
        <p>Dear ${customerName},</p>

        <p>Your withdrawal request of <strong>KSh ${Number(amount).toLocaleString()}</strong> has been
        <strong>${isApproved ? "approved" : "rejected"}</strong>.</p>

        ${isApproved ? `<p>Transaction Code: <strong>${transactionCode}</strong></p>` : ""}
        ${notes ? `<p>Note from ${COMPANY_NAME}: ${notes}</p>` : ""}

        <p>
            Best regards,<br>
            <strong>${COMPANY_NAME}</strong><br>
            Customer Support<br>
            ${COMPANY_EMAIL}<br>
            ${COMPANY_WEBSITE}
        </p>
    </div>
    `;

}

async function sendWithdrawalStatusEmail({ to, customerName, amount, status, transactionCode, notes }) {

    return sendMail({
        to,
        subject: `${COMPANY_NAME} withdrawal ${status === "approved" ? "approved" : "update"}`,
        html: withdrawalStatusEmailHtml({ customerName, amount, status, transactionCode, notes })
    });

}

// ======================================================
// ORDER DELIVERED EMAIL
// ======================================================

function deliveryEmailHtml({ customerName, orderNumber, deliveryDate }) {

    return `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6;">
        <p>Dear ${customerName},</p>

        <p>We are pleased to inform you that your order has been successfully delivered.</p>

        <p><strong>Order Details</strong></p>

        <ul>
            <li>Order Number: ${orderNumber}</li>
            <li>Delivery Date: ${deliveryDate}</li>
        </ul>

        <p>We hope you enjoy your purchase. Thank you for choosing <strong>${COMPANY_NAME}</strong>.</p>

        <p>If there is any issue with your order or if you have any questions, please contact us within the specified support period, and we'll be happy to assist you.</p>

        <p>We truly appreciate your trust in us and look forward to serving you again.</p>

        <p>
            Kind regards,<br>
            <strong>${COMPANY_NAME}</strong><br>
            Customer Service Team<br>
            ${COMPANY_EMAIL}<br>
            ${COMPANY_WEBSITE}
        </p>
    </div>
    `;

}

async function sendDeliveryEmail({ to, customerName, orderNumber, deliveryDate }) {

    return sendMail({
        to,
        subject: `Your ${COMPANY_NAME} order #${orderNumber} has been delivered`,
        html: deliveryEmailHtml({ customerName, orderNumber, deliveryDate })
    });

}

module.exports = {
    sendWelcomeEmail,
    sendDeliveryEmail,
    sendVerificationEmail,
    sendWithdrawalStatusEmail
};
