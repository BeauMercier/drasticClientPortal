-- Migration for designer task management system
-- Creates tables for designer tasks and task status tracking

-- Designer tasks table
CREATE TABLE IF NOT EXISTS designer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'complete')) DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  designer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID,
  project_type TEXT CHECK (project_type IN ('web_design', 'logo_design', 'social_graphics')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task comments table for communication
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES designer_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES designer_tasks(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE designer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for designer_tasks

-- Admins have full access
CREATE POLICY "Admins have full access to designer tasks"
  ON designer_tasks FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view and update their own tasks
CREATE POLICY "Designers can access their tasks"
  ON designer_tasks FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    designer_id = auth.uid()
  );

-- Clients can view tasks related to their projects
CREATE POLICY "Clients can view tasks related to their projects"
  ON designer_tasks FOR SELECT
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

-- RLS policies for task_comments

-- Admins have full access
CREATE POLICY "Admins have full access to task comments"
  ON task_comments FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view all comments and create/update their own
CREATE POLICY "Designers can view all comments"
  ON task_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    task_id IN (SELECT id FROM designer_tasks WHERE designer_id = auth.uid())
  );

CREATE POLICY "Designers can create and update their comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'designer' AND
    user_id = auth.uid() AND
    task_id IN (SELECT id FROM designer_tasks WHERE designer_id = auth.uid())
  );

-- Clients can view and add comments to tasks related to their projects
CREATE POLICY "Clients can view and comment on their project tasks"
  ON task_comments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    task_id IN (
      SELECT dt.id 
      FROM designer_tasks dt
      WHERE dt.project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients can add comments to their project tasks"
  ON task_comments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid() AND
    task_id IN (
      SELECT dt.id 
      FROM designer_tasks dt
      WHERE dt.project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

-- RLS policies for task_attachments

-- Admins have full access
CREATE POLICY "Admins have full access to task attachments"
  ON task_attachments FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view all attachments and upload their own
CREATE POLICY "Designers can view all attachments"
  ON task_attachments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    task_id IN (SELECT id FROM designer_tasks WHERE designer_id = auth.uid())
  );

CREATE POLICY "Designers can upload attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'designer' AND
    created_by = auth.uid() AND
    task_id IN (SELECT id FROM designer_tasks WHERE designer_id = auth.uid())
  );

-- Clients can view attachments related to their projects
CREATE POLICY "Clients can view attachments related to their projects"
  ON task_attachments FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    task_id IN (
      SELECT dt.id 
      FROM designer_tasks dt
      WHERE dt.project_id IN (
        SELECT id FROM web_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
        UNION
        SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_designer_tasks_timestamp
BEFORE UPDATE ON designer_tasks
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER update_task_comments_timestamp
BEFORE UPDATE ON task_comments
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column(); 