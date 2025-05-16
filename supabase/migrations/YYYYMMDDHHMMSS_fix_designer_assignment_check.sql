CREATE OR REPLACE FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_assigned BOOLEAN;
BEGIN
  -- Use row_security = off to bypass RLS
  SET LOCAL row_security = off;

  -- Check direct assignment from the correct table
  SELECT EXISTS (
    SELECT 1 FROM public.designer_projects -- Changed from project_assignments
    WHERE designer_id = d_id
      AND project_id = p_id
      AND project_type::TEXT = p_type
  ) INTO is_assigned;

  RETURN is_assigned;
END;
$$;

COMMENT ON FUNCTION "auth_helpers"."is_designer_assigned_to_project"("d_id" "uuid", "p_id" "uuid", "p_type" "text") IS 'Checks project assignment bypassing RLS (Corrected to use designer_projects table)'; 