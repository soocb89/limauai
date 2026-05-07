ALTER TYPE customer_source ADD VALUE IF NOT EXISTS 'lead';

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'lead';

-- Existing excel_import = customer, bot_captured = lead
UPDATE customers SET status = 'customer' WHERE source = 'excel_import';
UPDATE customers SET status = 'lead'     WHERE source = 'bot_captured';
