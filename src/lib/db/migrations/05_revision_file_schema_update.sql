-- Rename external_link to external_url (consistent naming)
ALTER TABLE revision_files 
  RENAME COLUMN external_link TO external_url;

-- Update mockup_type to use the new types
ALTER TABLE revision_files 
  DROP CONSTRAINT IF EXISTS revision_files_mockup_type_check;

ALTER TABLE revision_files 
  ADD CONSTRAINT revision_files_mockup_type_check 
  CHECK (mockup_type IN ('image', 'figma', 'wordpress', 'other'));

-- Convert existing data
UPDATE revision_files
  SET mockup_type = 'figma'
  WHERE link_type = 'figma';

UPDATE revision_files
  SET mockup_type = 'wordpress'
  WHERE link_type = 'wordpress';

UPDATE revision_files
  SET mockup_type = 'other'
  WHERE link_type = 'other';

-- We no longer need link_type as that information is now in mockup_type
ALTER TABLE revision_files
  DROP COLUMN link_type;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_revision_files_mockup_type
  ON revision_files(mockup_type);

CREATE INDEX IF NOT EXISTS idx_revision_files_revision_id
  ON revision_files(revision_id);

-- Update comment
COMMENT ON TABLE revision_files IS 'Stores files and links associated with project revisions'; 