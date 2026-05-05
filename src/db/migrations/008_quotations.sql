CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'expired');

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quotation_ref VARCHAR(100),
  quotation_url TEXT,
  insurer VARCHAR(100),
  amount DECIMAL(10,2),
  status quotation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
