-- ======================================================
-- Adds the "status" column used to mark a product as
-- Active or Inactive (shown/hidden from customers) and
-- backfills any existing rows to "Active".
-- Run this once against your PostgreSQL database (the
-- one in BACKEND/.env, DB_NAME).
--
-- From a terminal:
--   psql -U postgres -d africart -f 003_add_product_status.sql
-- or paste the statements into psql / pgAdmin.
-- ======================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- Existing products created before this migration are treated as Active
-- so nothing disappears from the storefront after upgrading.
UPDATE products SET status = 'Active' WHERE status IS NULL;
