ALTER TABLE follow_up_jobs
  ADD CONSTRAINT follow_up_jobs_customer_type_step_unique
  UNIQUE (customer_id, type, step);
