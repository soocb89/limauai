CREATE TYPE customer_source AS ENUM ('excel_import', 'bot_captured');

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  language VARCHAR(10),
  renewal_date DATE,
  car_plate VARCHAR(20),
  insurer VARCHAR(100),
  senang_customer_id VARCHAR(100),
  consent BOOLEAN NOT NULL DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  source customer_source NOT NULL DEFAULT 'bot_captured',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
