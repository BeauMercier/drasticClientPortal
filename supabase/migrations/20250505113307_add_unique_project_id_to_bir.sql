-- Add UNIQUE constraint on project_id
ALTER TABLE public.business_information_requests
  ADD CONSTRAINT business_information_requests_project_id_key -- Changed name slightly to match Supabase convention (_key)
  UNIQUE (project_id);

-- Optional: Add down migration if needed for rollback
/*
-- Down Migration (Rollback)
ALTER TABLE public.business_information_requests
  DROP CONSTRAINT IF EXISTS business_information_requests_project_id_key;
*/
