-- Migration: Implement Row Level Security policies for core tables
-- This migration applies RLS policies to the main project tables and related entities

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
CREATE OR REPLACE FUNCTION is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_assignments
    WHERE designer_id = d_id AND project_id = p_id AND project_type = p_type
  );
END;
$function$ LANGUAGE plpgsql;

-- 1. Web Design Projects Table
ALTER TABLE web_design_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own web design projects
CREATE POLICY "Users can view own web design projects"
  ON web_design_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own web design projects
CREATE POLICY "Users can update own web design projects"
  ON web_design_projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own web design projects
CREATE POLICY "Users can insert own web design projects"
  ON web_design_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all web design projects
CREATE POLICY "Admins can view all web design projects"
  ON web_design_projects FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all web design projects
CREATE POLICY "Admins can update all web design projects"
  ON web_design_projects FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view web design projects assigned to them
CREATE POLICY "Designers can view assigned web design projects"
  ON web_design_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    id IN (
      SELECT project_id FROM project_assignments 
      WHERE designer_id = auth.uid() AND project_type = 'web_design'
    )
  );

-- 2. Logo Design Projects Table
ALTER TABLE logo_design_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own logo design projects
CREATE POLICY "Users can view own logo design projects"
  ON logo_design_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own logo design projects
CREATE POLICY "Users can update own logo design projects"
  ON logo_design_projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own logo design projects
CREATE POLICY "Users can insert own logo design projects"
  ON logo_design_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all logo design projects
CREATE POLICY "Admins can view all logo design projects"
  ON logo_design_projects FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all logo design projects
CREATE POLICY "Admins can update all logo design projects"
  ON logo_design_projects FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view logo design projects assigned to them
CREATE POLICY "Designers can view assigned logo design projects"
  ON logo_design_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    id IN (
      SELECT project_id FROM project_assignments 
      WHERE designer_id = auth.uid() AND project_type = 'logo_design'
    )
  );

-- 3. Social Graphics Projects Table
ALTER TABLE social_graphics_projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own social graphics projects
CREATE POLICY "Users can view own social graphics projects"
  ON social_graphics_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own social graphics projects
CREATE POLICY "Users can update own social graphics projects"
  ON social_graphics_projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own social graphics projects
CREATE POLICY "Users can insert own social graphics projects"
  ON social_graphics_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all social graphics projects
CREATE POLICY "Admins can view all social graphics projects"
  ON social_graphics_projects FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all social graphics projects
CREATE POLICY "Admins can update all social graphics projects"
  ON social_graphics_projects FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view social graphics projects assigned to them
CREATE POLICY "Designers can view assigned social graphics projects"
  ON social_graphics_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    id IN (
      SELECT project_id FROM project_assignments 
      WHERE designer_id = auth.uid() AND project_type = 'social_graphics'
    )
  );

-- 4. Project Revisions Table
ALTER TABLE project_revisions ENABLE ROW LEVEL SECURITY;

-- Clients can view revisions for their own projects
CREATE POLICY "Clients can view revisions for their own projects"
  ON project_revisions FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    project_id IN (
      SELECT id FROM web_design_projects WHERE user_id = auth.uid()
      UNION
      SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
      UNION
      SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
    )
  );

-- Designers can view revisions for projects assigned to them
CREATE POLICY "Designers can view revisions for assigned projects"
  ON project_revisions FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    project_id IN (
      SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
    )
  );

-- Designers can insert revisions for projects assigned to them
CREATE POLICY "Designers can insert revisions for assigned projects"
  ON project_revisions FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'designer' AND
    project_id IN (
      SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
    )
  );

-- Designers can update revisions for projects assigned to them
CREATE POLICY "Designers can update revisions for assigned projects"
  ON project_revisions FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    project_id IN (
      SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
    )
  );

-- Admins can view all revisions
CREATE POLICY "Admins can view all revisions"
  ON project_revisions FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can insert revisions
CREATE POLICY "Admins can insert revisions"
  ON project_revisions FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Admins can update revisions
CREATE POLICY "Admins can update revisions"
  ON project_revisions FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- 5. Revision Files Table
ALTER TABLE revision_files ENABLE ROW LEVEL SECURITY;

-- Clients can view files for their own project revisions
CREATE POLICY "Clients can view files for their own project revisions"
  ON revision_files FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

-- Designers can view files for revisions of assigned projects
CREATE POLICY "Designers can view files for assigned project revisions"
  ON revision_files FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
      )
    )
  );

-- Designers can insert files for revisions of assigned projects
CREATE POLICY "Designers can insert files for assigned project revisions"
  ON revision_files FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'designer' AND
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
      )
    )
  );

-- Admins can view all revision files
CREATE POLICY "Admins can view all revision files"
  ON revision_files FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can insert and update revision files
CREATE POLICY "Admins can insert revision files"
  ON revision_files FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update revision files"
  ON revision_files FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- 6. Revision Comments Table
ALTER TABLE revision_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own project revisions
CREATE POLICY "Users can view comments on their own project revisions"
  ON revision_comments FOR SELECT
  USING (
    auth.uid() = user_id OR
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert comments on their own project revisions
CREATE POLICY "Users can insert comments on their own project revisions"
  ON revision_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

-- Designers can view comments on revisions for projects they're assigned to
CREATE POLICY "Designers can view comments on assigned project revisions"
  ON revision_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
      )
    )
  );

-- Designers can insert comments on revisions for projects they're assigned to
CREATE POLICY "Designers can insert comments on assigned project revisions"
  ON revision_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'designer' AND
    revision_id IN (
      SELECT id FROM project_revisions WHERE project_id IN (
        SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
      )
    )
  );

-- Admins can view all revision comments
CREATE POLICY "Admins can view all revision comments"
  ON revision_comments FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can insert and update revision comments
CREATE POLICY "Admins can insert revision comments"
  ON revision_comments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- 7. Support Tickets Table
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own support tickets
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own support tickets
CREATE POLICY "Users can insert own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all support tickets
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all support tickets
CREATE POLICY "Admins can update all support tickets"
  ON support_tickets FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- 8. Profiles Table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Designers can view client profiles
CREATE POLICY "Designers can view client profiles"
  ON profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    role = 'client' AND
    id IN (
      -- Client profiles for projects assigned to this designer
      SELECT user_id FROM web_design_projects WHERE id IN 
        (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = 'web_design')
      UNION
      SELECT user_id FROM logo_design_projects WHERE id IN 
        (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = 'logo_design')
      UNION
      SELECT user_id FROM social_graphics_projects WHERE id IN 
        (SELECT project_id FROM project_assignments WHERE designer_id = auth.uid() AND project_type = 'social_graphics')
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin'); 