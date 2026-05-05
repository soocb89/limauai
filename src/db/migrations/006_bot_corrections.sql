CREATE TABLE bot_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  original_reply TEXT NOT NULL,
  corrected_reply TEXT NOT NULL,
  intent VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
