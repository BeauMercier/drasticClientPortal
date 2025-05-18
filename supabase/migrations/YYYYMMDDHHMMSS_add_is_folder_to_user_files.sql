-- Add is_folder column to user_files table
ALTER TABLE "public"."user_files"
ADD COLUMN "is_folder" BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: Add a comment to the new column
COMMENT ON COLUMN "public"."user_files"."is_folder" IS 'True if the entry represents a folder, false if it represents a file.'; 