-- Migration: Safely implement Row Level Security policies for core tables
-- This migration checks if policies exist before creating them to avoid errors

-- Helper function to check if a user is an admin (if not already created)
DO $outer$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
    CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
    RETURNS TEXT AS $function$
    DECLARE
      user_role TEXT;
    BEGIN
      SELECT role INTO user_role
      FROM profiles
      WHERE id = user_id;
      
      RETURN COALESCE(user_role, 'unknown');
    END;
    $function$ LANGUAGE plpgsql;
  END IF;
END $outer$;

-- Helper function to check if a designer is assigned to a project
DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_designer_assigned_to_project') THEN
    CREATE OR REPLACE FUNCTION is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
    RETURNS BOOLEAN AS $function$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM project_assignments
        WHERE designer_id = d_id AND project_id = p_id AND project_type = p_type
      );
    END;
    $function$ LANGUAGE plpgsql;
  END IF;
END $outer$;

-- Function to safely create a policy if it doesn't exist
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  policy_name TEXT,
  table_name TEXT,
  command TEXT,
  using_expr TEXT DEFAULT NULL,
  check_expr TEXT DEFAULT NULL,
  roles TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Check if the policy already exists
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE policyname = policy_name 
    AND tablename = table_name
  ) INTO policy_exists;
  
  -- If it doesn't exist, create it
  IF NOT policy_exists THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s %s %s %s',
      policy_name,
      table_name,
      command,
      CASE WHEN using_expr IS NOT NULL THEN 'USING (' || using_expr || ')' ELSE '' END,
      CASE WHEN check_expr IS NOT NULL THEN 'WITH CHECK (' || check_expr || ')' ELSE '' END,
      CASE WHEN roles IS NOT NULL THEN 'TO ' || roles ELSE '' END
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely enable RLS on a table if not already enabled
CREATE OR REPLACE FUNCTION enable_rls_if_not_enabled(
  table_name TEXT
) RETURNS VOID AS $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- Check if RLS is already enabled
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = table_name
  AND n.nspname = 'public';
  
  -- If it's not enabled, enable it
  IF NOT rls_enabled THEN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Now apply RLS to each table safely

-- 1. Web Design Projects
SELECT enable_rls_if_not_enabled('web_design_projects');

SELECT create_policy_if_not_exists(
  'Users can view own web design projects',
  'web_design_projects',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update own web design projects',
  'web_design_projects',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert own web design projects',
  'web_design_projects',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Admins can view all web design projects',
  'web_design_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update all web design projects',
  'web_design_projects',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Designers can view assigned web design projects',
  'web_design_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''web_design'')'
);

-- 2. Logo Design Projects
SELECT enable_rls_if_not_enabled('logo_design_projects');

SELECT create_policy_if_not_exists(
  'Users can view own logo design projects',
  'logo_design_projects',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update own logo design projects',
  'logo_design_projects',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert own logo design projects',
  'logo_design_projects',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Admins can view all logo design projects',
  'logo_design_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update all logo design projects',
  'logo_design_projects',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Designers can view assigned logo design projects',
  'logo_design_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''logo_design'')'
);

-- 3. Social Graphics Projects
SELECT enable_rls_if_not_enabled('social_graphics_projects');

SELECT create_policy_if_not_exists(
  'Users can view own social graphics projects',
  'social_graphics_projects',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can update own social graphics projects',
  'social_graphics_projects',
  'UPDATE',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert own social graphics projects',
  'social_graphics_projects',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Admins can view all social graphics projects',
  'social_graphics_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update all social graphics projects',
  'social_graphics_projects',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Designers can view assigned social graphics projects',
  'social_graphics_projects',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''social_graphics'')'
);

-- 4. Project Revisions Table
SELECT enable_rls_if_not_enabled('project_revisions');

SELECT create_policy_if_not_exists(
  'Clients can view revisions for their own projects',
  'project_revisions',
  'SELECT',
  'get_user_role(auth.uid()) = ''client'' AND project_id IN (SELECT id FROM web_design_projects WHERE user_id = auth.uid() UNION SELECT id FROM logo_design_projects WHERE user_id = auth.uid() UNION SELECT id FROM social_graphics_projects WHERE user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Designers can view revisions for assigned projects',
  'project_revisions',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND project_id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Designers can insert revisions for assigned projects',
  'project_revisions',
  'INSERT',
  NULL,
  'get_user_role(auth.uid()) = ''designer'' AND project_id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Designers can update revisions for assigned projects',
  'project_revisions',
  'UPDATE',
  'get_user_role(auth.uid()) = ''designer'' AND project_id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
  'Admins can view all revisions',
  'project_revisions',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can insert revisions',
  'project_revisions',
  'INSERT',
  NULL,
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update revisions',
  'project_revisions',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

-- 5. Revision Files Table
SELECT enable_rls_if_not_enabled('revision_files');

SELECT create_policy_if_not_exists(
  'Clients can view files for their own project revisions',
  'revision_files',
  'SELECT',
  'get_user_role(auth.uid()) = ''client'' AND revision_id IN (SELECT id FROM project_revisions WHERE project_id IN (SELECT id FROM web_design_projects WHERE user_id = auth.uid() UNION SELECT id FROM logo_design_projects WHERE user_id = auth.uid() UNION SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()))'
);

SELECT create_policy_if_not_exists(
  'Designers can view files for assigned project revisions',
  'revision_files',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND revision_id IN (SELECT id FROM project_revisions WHERE project_id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()))'
);

SELECT create_policy_if_not_exists(
  'Designers can insert files for assigned project revisions',
  'revision_files',
  'INSERT',
  NULL,
  'get_user_role(auth.uid()) = ''designer'' AND revision_id IN (SELECT id FROM project_revisions WHERE project_id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()))'
);

SELECT create_policy_if_not_exists(
  'Admins can view all revision files',
  'revision_files',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can insert revision files',
  'revision_files',
  'INSERT',
  NULL,
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update revision files',
  'revision_files',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

-- 6. Support Tickets Table
SELECT enable_rls_if_not_enabled('support_tickets');

SELECT create_policy_if_not_exists(
  'Users can view own support tickets',
  'support_tickets',
  'SELECT',
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Users can insert own support tickets',
  'support_tickets',
  'INSERT',
  NULL,
  'auth.uid() = user_id'
);

SELECT create_policy_if_not_exists(
  'Admins can view all support tickets',
  'support_tickets',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update all support tickets',
  'support_tickets',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

-- 7. Profiles Table
SELECT enable_rls_if_not_enabled('profiles');

SELECT create_policy_if_not_exists(
  'Users can view own profile',
  'profiles',
  'SELECT',
  'auth.uid() = id'
);

SELECT create_policy_if_not_exists(
  'Users can update own profile',
  'profiles',
  'UPDATE',
  'auth.uid() = id'
);

SELECT create_policy_if_not_exists(
  'Designers can view client profiles',
  'profiles',
  'SELECT',
  'get_user_role(auth.uid()) = ''designer'' AND role = ''client'' AND id IN (SELECT user_id FROM web_design_projects WHERE id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''web_design'') UNION SELECT user_id FROM logo_design_projects WHERE id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''logo_design'') UNION SELECT user_id FROM social_graphics_projects WHERE id IN (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = ''social_graphics''))'
);

SELECT create_policy_if_not_exists(
  'Admins can view all profiles',
  'profiles',
  'SELECT',
  'get_user_role(auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
  'Admins can update all profiles',
  'profiles',
  'UPDATE',
  'get_user_role(auth.uid()) = ''admin'''
);

-- Drop the helper functions since they've served their purpose
DROP FUNCTION IF EXISTS create_policy_if_not_exists;
DROP FUNCTION IF EXISTS enable_rls_if_not_enabled; 