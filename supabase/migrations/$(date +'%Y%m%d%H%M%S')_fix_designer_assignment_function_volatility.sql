-- Migration to fix volatility and add search_path to is_designer_assigned_to_project function

BEGIN;

-- Recreate the function with VOLATILE and SET search_path
CREATE OR REPLACE FUNCTION "auth_helpers"."is_designer_assigned_to_project"(d_id uuid, p_id uuid, p_type text)
    RETURNS boolean
    LANGUAGE plpgsql
    VOLATILE -- Changed from STABLE
    SECURITY DEFINER
    SET search_path = public -- Added for security
    AS $$
DECLARE
  is_assigned BOOLEAN;
BEGIN
  -- Use row_security = off to bypass RLS
  SET LOCAL row_security = off;

  -- Check direct assignment
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE designer_id = d_id
      AND project_id = p_id
      AND project_type::TEXT = p_type
  ) INTO is_assigned;

  RETURN is_assigned;
END;
$$;

COMMIT; 