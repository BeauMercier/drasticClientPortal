-- Add timeline fields to web_design_projects table
ALTER TABLE web_design_projects 
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'discovery' CHECK (current_stage IN ('discovery', 'concept-development', 'refinement', 'finalization', 'delivery')),
  ADD COLUMN IF NOT EXISTS discovery_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS concept_development_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refinement_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS finalization_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper discovery date
UPDATE web_design_projects 
SET discovery_date = created_at 
WHERE discovery_date IS NULL;

-- Helper function to generate test data for the timeline
CREATE OR REPLACE FUNCTION populate_test_timeline_data() RETURNS void AS $$
DECLARE
  project_record RECORD;
  days_offset INTEGER;
BEGIN
  FOR project_record IN SELECT id FROM web_design_projects LOOP
    -- Set a random timeline stage for demonstration
    UPDATE web_design_projects
    SET current_stage = (
      CASE floor(random() * 5)
        WHEN 0 THEN 'discovery'
        WHEN 1 THEN 'concept-development' 
        WHEN 2 THEN 'refinement'
        WHEN 3 THEN 'finalization'
        ELSE 'delivery'
      END
    )
    WHERE id = project_record.id;
    
    -- Now set appropriate dates based on the current stage
    -- Discovery date is already set for all projects
    
    -- For concept-development and later stages
    IF (SELECT current_stage FROM web_design_projects WHERE id = project_record.id) IN 
       ('concept-development', 'refinement', 'finalization', 'delivery') THEN
      days_offset := floor(random() * 7 + 3); -- 3-10 days after creation
      UPDATE web_design_projects 
      SET concept_development_date = discovery_date + (days_offset || ' days')::interval
      WHERE id = project_record.id;
    END IF;
    
    -- For refinement and later stages
    IF (SELECT current_stage FROM web_design_projects WHERE id = project_record.id) IN 
       ('refinement', 'finalization', 'delivery') THEN
      days_offset := floor(random() * 7 + 3); -- 3-10 days after concept
      UPDATE web_design_projects 
      SET refinement_date = concept_development_date + (days_offset || ' days')::interval
      WHERE id = project_record.id;
    END IF;
    
    -- For finalization and later stages
    IF (SELECT current_stage FROM web_design_projects WHERE id = project_record.id) IN 
       ('finalization', 'delivery') THEN
      days_offset := floor(random() * 7 + 3); -- 3-10 days after refinement
      UPDATE web_design_projects 
      SET finalization_date = refinement_date + (days_offset || ' days')::interval
      WHERE id = project_record.id;
    END IF;
    
    -- For delivery stage
    IF (SELECT current_stage FROM web_design_projects WHERE id = project_record.id) = 'delivery' THEN
      days_offset := floor(random() * 7 + 3); -- 3-10 days after finalization
      UPDATE web_design_projects 
      SET delivery_date = finalization_date + (days_offset || ' days')::interval
      WHERE id = project_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function if test data is needed
SELECT populate_test_timeline_data();

-- Clean up the function afterward
DROP FUNCTION populate_test_timeline_data(); 