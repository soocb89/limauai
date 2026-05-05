CREATE TYPE followup_type AS ENUM ('renewal_reminder', 'quote_followup', 'promotion', 'broadcast');
CREATE TYPE followup_status AS ENUM ('pending', 'sent', 'cancelled');

CREATE TABLE follow_up_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type followup_type NOT NULL,
  step VARCHAR(10),
  ref_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status followup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX follow_up_jobs_scheduled_idx ON follow_up_jobs(scheduled_at, status);
CREATE INDEX follow_up_jobs_customer_idx ON follow_up_jobs(customer_id);
