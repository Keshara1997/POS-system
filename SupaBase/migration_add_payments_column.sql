-- Migration: Add payments column and support 'split' payment_method

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;

-- Update payment_method check to include 'split'
ALTER TABLE sales
  DROP CONSTRAINT IF EXISTS sales_payment_method_check;

ALTER TABLE sales
  ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash', 'card', 'digital', 'credit', 'split'));

-- Optional: create index to search payments -> e.g., by payment method
CREATE INDEX IF NOT EXISTS idx_sales_payments_methods ON sales USING gin ((payments->>'method'));

-- Note: If you prefer a separate payments table for normalization, create a new table payments linked to sales.id
-- and migrate existing payments JSON into that table. For quick support, JSONB column is the fastest path.
