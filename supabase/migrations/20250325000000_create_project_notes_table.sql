-- Create project notes table

CREATE TABLE IF NOT EXISTS public.project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  project_type TEXT NOT NULL,
  designer_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_project_notes_project ON public.project_notes(project_id, project_type);
CREATE INDEX idx_project_notes_designer ON public.project_notes(designer_id);

-- Enable RLS
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow read access to project notes (both client and designers)
CREATE POLICY "Project owners can view their notes" 
ON public.project_notes
FOR SELECT 
USING (
  (project_id IN (
    SELECT id FROM web_design_projects WHERE user_id = auth.uid()
    UNION ALL
    SELECT id FROM logo_design_projects WHERE user_id = auth.uid()
    UNION ALL
    SELECT id FROM social_graphics_projects WHERE user_id = auth.uid()
  )) OR designer_id = auth.uid()
);

-- Allow designers to create notes for projects assigned to them
CREATE POLICY "Designers can create notes for their projects" 
ON public.project_notes
FOR INSERT 
WITH CHECK (
  designer_id = auth.uid() AND
  (project_id IN (
    SELECT project_id FROM designer_projects 
    WHERE designer_id = auth.uid() AND project_type = project_notes.project_type
  ))
);

-- Allow designers to update their own notes
CREATE POLICY "Designers can update their own notes" 
ON public.project_notes
FOR UPDATE 
USING (designer_id = auth.uid());

-- Allow designers to delete their own notes
CREATE POLICY "Designers can delete their own notes" 
ON public.project_notes
FOR DELETE 
USING (designer_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_notes_timestamp
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp(); 