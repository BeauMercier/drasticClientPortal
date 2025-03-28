-- Create the web_design_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS web_design_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  status TEXT NOT NULL,
  thumbnail_url TEXT,
  current_stage TEXT DEFAULT 'discovery' CHECK (current_stage IN ('discovery', 'concept-development', 'refinement', 'finalization', 'delivery')),
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  concept_development_date TIMESTAMP WITH TIME ZONE,
  refinement_date TIMESTAMP WITH TIME ZONE,
  finalization_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE web_design_projects ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security Policies
CREATE POLICY "Users can view their own projects" 
  ON web_design_projects 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
  ON web_design_projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON web_design_projects 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Insert a sample project for testing
INSERT INTO web_design_projects (
  name, 
  description, 
  user_id, 
  client, 
  status, 
  current_stage
) VALUES (
  'Sample Web Design Project',
  'This is a sample project for testing the timeline feature',
  auth.uid(),
  'Sample Client',
  'In Progress',
  'discovery'
); 