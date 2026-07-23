const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Test connection
pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.log("❌ PostgreSQL Connection Error:", err.message);
    } else {
        console.log("✅ Connected to PostgreSQL Database");
    }
});

module.exports = pool;