-- PERMANENT COMPREHENSIVE RLS FIX FOR ALL TABLES
-- Extends the profiles fix to all tables with RLS policies
-- Complete architectural solution for eliminating recursion issues

BEGIN;

-- First ensure the auth_helpers schema and core functions exist
DO $$
BEGIN
  -- Check if our first script was already run
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth_helpers') THEN
    RAISE EXCEPTION 'Please run permanent_rls_fix.sql first to create the auth_helpers schema and core functions';
  END IF;
END $$;

-- -------------------------------------------------------------
-- PART 1: FIX WEB DESIGN PROJECTS TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'web_design_projects' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.web_design_projects', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Users can view own web design projects" 
ON public.web_design_projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own web design projects" 
ON public.web_design_projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can access all web design projects" 
ON public.web_design_projects
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can view assigned web design projects" 
ON public.web_design_projects
FOR SELECT
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = web_design_projects.id
      AND pa.project_type::TEXT = 'web_design'
  )
);

CREATE POLICY "Designers can update assigned web design projects" 
ON public.web_design_projects
FOR UPDATE
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = web_design_projects.id
      AND pa.project_type::TEXT = 'web_design'
  )
);

-- -------------------------------------------------------------
-- PART 2: FIX LOGO DESIGN PROJECTS TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'logo_design_projects' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.logo_design_projects', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Users can view own logo design projects" 
ON public.logo_design_projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own logo design projects" 
ON public.logo_design_projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can access all logo design projects" 
ON public.logo_design_projects
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can view assigned logo design projects" 
ON public.logo_design_projects
FOR SELECT
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = logo_design_projects.id
      AND pa.project_type::TEXT = 'logo_design'
  )
);

CREATE POLICY "Designers can update assigned logo design projects" 
ON public.logo_design_projects
FOR UPDATE
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = logo_design_projects.id
      AND pa.project_type::TEXT = 'logo_design'
  )
);

-- -------------------------------------------------------------
-- PART 3: FIX SOCIAL GRAPHICS PROJECTS TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'social_graphics_projects' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.social_graphics_projects', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Users can view own social graphics projects" 
ON public.social_graphics_projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own social graphics projects" 
ON public.social_graphics_projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can access all social graphics projects" 
ON public.social_graphics_projects
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can view assigned social graphics projects" 
ON public.social_graphics_projects
FOR SELECT
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = social_graphics_projects.id
      AND pa.project_type::TEXT = 'social_graphics'
  )
);

CREATE POLICY "Designers can update assigned social graphics projects" 
ON public.social_graphics_projects
FOR UPDATE
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = social_graphics_projects.id
      AND pa.project_type::TEXT = 'social_graphics'
  )
);

-- -------------------------------------------------------------
-- PART 4: FIX PROJECT REVISIONS TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'project_revisions' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_revisions', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Admins can access all revisions" 
ON public.project_revisions
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

-- Users can see revisions for their own projects
CREATE POLICY "Users can view revisions for own projects" 
ON public.project_revisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    -- Web Design Projects
    SELECT 1 
    FROM public.web_design_projects wdp
    WHERE wdp.id = project_revisions.project_id
      AND project_revisions.project_type::TEXT = 'web_design'
      AND wdp.user_id = auth.uid()
  )
  OR
  EXISTS (
    -- Logo Design Projects
    SELECT 1 
    FROM public.logo_design_projects ldp
    WHERE ldp.id = project_revisions.project_id
      AND project_revisions.project_type::TEXT = 'logo_design'
      AND ldp.user_id = auth.uid()
  )
  OR
  EXISTS (
    -- Social Graphics Projects
    SELECT 1 
    FROM public.social_graphics_projects sgp
    WHERE sgp.id = project_revisions.project_id
      AND project_revisions.project_type::TEXT = 'social_graphics'
      AND sgp.user_id = auth.uid()
  )
);

-- Designers can see and create revisions for assigned projects
CREATE POLICY "Designers can view and manage revisions for assigned projects" 
ON public.project_revisions
FOR ALL
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = project_revisions.project_id
      AND pa.project_type::TEXT = project_revisions.project_type::TEXT
  )
);

-- -------------------------------------------------------------
-- PART 5: FIX REVISION FILES TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'revision_files' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.revision_files', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Admins can access all revision files" 
ON public.revision_files
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

-- Users can see files for their own project revisions
CREATE POLICY "Users can view files for own project revisions" 
ON public.revision_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.project_revisions pr
    WHERE pr.id = revision_files.revision_id
    AND (
      -- Web Design Projects
      EXISTS (
        SELECT 1 
        FROM public.web_design_projects wdp
        WHERE wdp.id = pr.project_id
          AND pr.project_type::TEXT = 'web_design'
          AND wdp.user_id = auth.uid()
      )
      OR
      -- Logo Design Projects
      EXISTS (
        SELECT 1 
        FROM public.logo_design_projects ldp
        WHERE ldp.id = pr.project_id
          AND pr.project_type::TEXT = 'logo_design'
          AND ldp.user_id = auth.uid()
      )
      OR
      -- Social Graphics Projects
      EXISTS (
        SELECT 1 
        FROM public.social_graphics_projects sgp
        WHERE sgp.id = pr.project_id
          AND pr.project_type::TEXT = 'social_graphics'
          AND sgp.user_id = auth.uid()
      )
    )
  )
);

-- Designers can manage files for assigned projects
CREATE POLICY "Designers can manage files for assigned projects" 
ON public.revision_files
FOR ALL
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_revisions pr
    JOIN public.project_assignments pa ON pa.project_id = pr.project_id AND pa.project_type::TEXT = pr.project_type::TEXT
    WHERE pr.id = revision_files.revision_id
      AND pa.designer_id = auth.uid()
  )
);

-- -------------------------------------------------------------
-- PART 6: FIX SUPPORT TICKETS TABLE
-- -------------------------------------------------------------

-- Remove existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'support_tickets' 
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.support_tickets', policy_record.policyname);
  END LOOP;
END $$;

-- Create new policies using auth_helpers functions
CREATE POLICY "Users can view and create own tickets" 
ON public.support_tickets
FOR ALL
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Admins can access all tickets" 
ON public.support_tickets
FOR ALL
TO authenticated
USING (auth_helpers.get_user_role(auth.uid()) = 'admin');

-- Project related tickets can be seen by designers assigned to that project
CREATE POLICY "Designers can view project-related tickets" 
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  auth_helpers.get_user_role(auth.uid()) = 'designer'
  AND
  project_id IS NOT NULL
  AND
  project_type IS NOT NULL
  AND
  EXISTS (
    SELECT 1 
    FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
      AND pa.project_id = support_tickets.project_id
      AND pa.project_type::TEXT = support_tickets.project_type::TEXT
  )
);

-- -------------------------------------------------------------
-- PART 7: VERIFY IMPLEMENTATION
-- -------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE 'COMPREHENSIVE RLS FIX COMPLETED FOR ALL TABLES:';
  RAISE NOTICE '1. web_design_projects: Policies updated to use auth_helpers functions';
  RAISE NOTICE '2. logo_design_projects: Policies updated to use auth_helpers functions';
  RAISE NOTICE '3. social_graphics_projects: Policies updated to use auth_helpers functions';
  RAISE NOTICE '4. project_revisions: Policies updated to use auth_helpers functions';
  RAISE NOTICE '5. revision_files: Policies updated to use auth_helpers functions';
  RAISE NOTICE '6. support_tickets: Policies updated to use auth_helpers functions';
END $$;

COMMIT; 