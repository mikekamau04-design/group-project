-- ======================================================
-- Adds the columns needed for order tracking / checkout
-- delivery details. Run this once against your
-- PostgreSQL database (the one in BACKEND/.env, DB_NAME).
--
-- From a terminal:
--   psql -U postgres -d africart -f 001_add_order_delivery_fields.sql
-- or paste the statements into psql / pgAdmin.
-- ======================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;
