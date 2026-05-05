CREATE TYPE conversation_status AS ENUM ('open', 'handoff', 'resolved');

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status conversation_status NOT NULL DEFAULT 'open',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_customer_id_idx ON conversations(customer_id);
CREATE INDEX conversations_status_idx ON conversations(status);
