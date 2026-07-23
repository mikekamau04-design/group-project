const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail, sendVerificationEmail } = require("../utils/mailer");

// Generates a random 4-digit code as a string, e.g. "0492"
function generateVerificationCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

// =====================================================
// REGISTER USER
// =====================================================

exports.register = async (req, res) => {
    try {

         const {
    fullname,
    email,
    password,
    phone,
    role
} = req.body;

        // Validate input
        if (!fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide fullname, email and password"
            });
        }

        // Check if email already exists
        const existingUser = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a 4-digit email verification code (valid 15 minutes)
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

        // Save User (unverified until they enter the code)
       const result = await db.query(
    `INSERT INTO users
    (fullname, email, password, phone, role, is_verified, verification_code, verification_expires)
    VALUES ($1, $2, $3, $4, $5, false, $6, $7)
    RETURNING id, fullname, email, role`,
    [
        fullname,
        email,
        hashedPassword,
        phone,
        role || "customer",
        verificationCode,
        verificationExpires
    ]
);

        // Send verification email (does not block/fail registration if it errors)
        sendVerificationEmail({
            to: result.rows[0].email,
            customerName: result.rows[0].fullname,
            code: verificationCode
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email for a 4-digit verification code.",
            requiresVerification: true,
            user: result.rows[0]
        });

    } catch (error) {

        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// VERIFY EMAIL (4-digit code)
// =====================================================

exports.verifyEmail = async (req, res) => {
    try {

        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email and the verification code"
            });
        }

        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No account found with that email"
            });
        }

        const user = result.rows[0];

        if (user.is_verified) {
            return res.status(200).json({
                success: true,
                message: "This account is already verified"
            });
        }

        if (!user.verification_code || user.verification_code !== String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Incorrect verification code"
            });
        }

        if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "This code has expired. Please request a new one."
            });
        }

        await db.query(
            `UPDATE users
             SET is_verified = true, verification_code = NULL, verification_expires = NULL
             WHERE id = $1`,
            [user.id]
        );

        // Now that the account is confirmed, send the welcome email
        sendWelcomeEmail({
            to: user.email,
            customerName: user.fullname
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {

        console.error("Verify Email Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// RESEND VERIFICATION CODE
// =====================================================

exports.resendVerification = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email"
            });
        }

        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No account found with that email"
            });
        }

        const user = result.rows[0];

        if (user.is_verified) {
            return res.status(200).json({
                success: true,
                message: "This account is already verified"
            });
        }

        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(
            `UPDATE users
             SET verification_code = $1, verification_expires = $2
             WHERE id = $3`,
            [verificationCode, verificationExpires, user.id]
        );

        sendVerificationEmail({
            to: user.email,
            customerName: user.fullname,
            code: verificationCode
        });

        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email."
        });

    } catch (error) {

        console.error("Resend Verification Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// LOGIN USER
// =====================================================

exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Check user
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Block login until the email has been verified
        if (!user.is_verified) {
            return res.status(403).json({
                success: false,
                requiresVerification: true,
                email: user.email,
                message: "Please verify your email before logging in. Check your inbox for the 4-digit code."
            });
        }

        // Create JWT Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "africart_secret_key",
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};