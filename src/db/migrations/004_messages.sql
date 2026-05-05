CREATE TYPE message_role AS ENUM ('user', 'bot', 'system');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  intent VARCHAR(50),
  language VARCHAR(10),
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_intent_idx ON messages(intent);
CREATE INDEX messages_confidence_idx ON messages(confidence);
