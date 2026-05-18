ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_document VARCHAR(255);
CREATE INDEX IF NOT EXISTS knowledge_base_source_document_idx ON knowledge_base(source_document);
