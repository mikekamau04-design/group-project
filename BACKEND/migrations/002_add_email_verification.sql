-- ======================================================
-- Adds the columns needed for email verification at
-- registration (4-digit code sent to the user's email).
-- Run this once against your PostgreSQL database (the
-- one in BACKEND/.env, DB_NAME).
--
-- From a terminal:
--   psql -U postgres -d africart -f 002_add_email_verification.sql
-- or paste the statements into psql / pgAdmin.
-- ======================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(4);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;

-- Existing accounts created before this migration are treated as
-- already verified so nobody currently using the app gets locked out.
UPDATE users SET is_verified = true WHERE is_verified IS NULL OR is_verified = false;
