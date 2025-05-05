-- ====================================================================
-- Migration: Add Business-Information-Request (BIR) workflow (REVISED v2)
-- Changes:
--  - Replaced business_profile_id with client_id (linking to profiles.id)
--  - Removed FK to generic projects table
--  - Added FK from client_id to profiles table (defined inline with CREATE TABLE)
--  - Updated RLS policy for clients
-- Depends on: helpers enable_rls_if_not_enabled(), create_policy_if_not_exists(),
--             get_user_role(), is_designer_assigned_to_project()
-- ====================================================================

BEGIN;

-----------------------------------------------------------------------
-- 1. ENUM bir_status
-----------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bir_status') THEN
        CREATE TYPE public.bir_status AS ENUM ('pending', 'submitted', 'approved');
    END IF;
END $$;

-----------------------------------------------------------------------
-- 2. TABLE business_information_requests
-----------------------------------------------------------------------
-- Drop table if it exists from a previous failed attempt (optional, for dev safety)
-- DROP TABLE IF EXISTS public.business_information_requests CASCADE; -- Use CASCADE if FKs might exist

-- Drop dependent type if exists (needed if dropping/recreating table)
-- DROP TYPE IF EXISTS public.bir_status CASCADE;
-- Recreate type if dropped
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bir_status') THEN
--         CREATE TYPE public.bir_status AS ENUM ('pending', 'submitted', 'approved');
--     END IF;
-- END $$;

CREATE TABLE IF NOT EXISTS public.business_information_requests (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id           uuid NOT NULL,          -- ID from specific project table (e.g., web_design_projects)
    project_type         text NOT NULL,          -- 'web_design' | 'logo_design' | 'social_graphics'
    client_id            uuid NOT NULL,
    status               public.bir_status NOT NULL DEFAULT 'pending',
    answers              jsonb        NOT NULL,  -- validated in application layer
    submitted_at         timestamptz,
    created_at           timestamptz  NOT NULL DEFAULT now(),
    updated_at           timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fk_bir_client FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE -- Define FK inline
);

-----------------------------------------------------------------------
-- 3. Foreign-key relationships (REMOVED ALTER TABLE for fk_bir_client)
-----------------------------------------------------------------------
-- FK definition moved into CREATE TABLE statement above.

-----------------------------------------------------------------------
-- 4. Automatic updated_at trigger
-----------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_set_updated_at_bir ON public.business_information_requests;
CREATE TRIGGER trg_set_updated_at_bir
    BEFORE UPDATE ON public.business_information_requests
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-----------------------------------------------------------------------
-- 5. Indexes
-----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bir_project       ON public.business_information_requests(project_id, project_type);
DROP INDEX IF EXISTS idx_bir_business_prof; -- Drop old index if it exists
CREATE INDEX IF NOT EXISTS idx_bir_client        ON public.business_information_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_bir_status        ON public.business_information_requests(status);

-----------------------------------------------------------------------
-- 6. Row-Level Security
-----------------------------------------------------------------------
SELECT public.enable_rls_if_not_enabled('business_information_requests');

SELECT public.create_policy_if_not_exists(
    'bir_admin_all',
    'business_information_requests',
    'ALL',
    $$ public.get_user_role(auth.uid()) = 'admin' AND project_type = 'web_design' $$
);

SELECT public.create_policy_if_not_exists(
    'bir_client_rw',
    'business_information_requests',
    'ALL',
    $$
        public.get_user_role(auth.uid()) = 'client'
        AND client_id = auth.uid()
        AND project_type = 'web_design'
    $$
);

SELECT public.create_policy_if_not_exists(
    'bir_designer_read',
    'business_information_requests',
    'SELECT',
    $$
        public.get_user_role(auth.uid()) = 'designer'
        AND public.is_designer_assigned_to_project(auth.uid(), project_id, project_type)
        AND project_type = 'web_design'
    $$
);

-----------------------------------------------------------------------
-- 7. Privileges
-----------------------------------------------------------------------
GRANT ALL ON TABLE public.business_information_requests TO authenticated, service_role, postgres;

COMMIT; 