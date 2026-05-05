CREATE TYPE customer_promotion_status AS ENUM ('pending', 'sent', 'converted');

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  message_template_bm TEXT,
  message_template_zh TEXT,
  message_template_ta TEXT,
  message_template_en TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  status customer_promotion_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  UNIQUE(customer_id, promotion_id)
);
