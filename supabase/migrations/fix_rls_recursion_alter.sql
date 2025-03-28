-- Fix infinite recursion in RLS policies for profiles table
-- This script updates the get_user_role function to avoid recursion

BEGIN;

-- Modify the existing function instead of dropping it
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Set search_path to prevent SQL injection
  SET search_path TO '';
  
  -- Explicitly tell Postgres to ignore RLS for this query
  SET LOCAL row_security = off;
  
  -- Direct query to get the role - with RLS disabled
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE id = user_id;

  RETURN COALESCE(user_role, 'unknown');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add a comment to the function to explain the RLS bypass
COMMENT ON FUNCTION public.get_user_role IS 'Gets the role of a user, bypassing RLS to avoid infinite recursion';

-- Also fix the is_designer_assigned_to_project function if it exists
DO $$
BEGIN
  -- Only modify if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_designer_assigned_to_project' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create or replace the function
    CREATE OR REPLACE FUNCTION public.is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
    RETURNS BOOLEAN AS $func$
    BEGIN
      -- Set search_path to prevent SQL injection
      SET search_path TO '';
      
      -- Explicitly tell Postgres to ignore RLS for this query
      SET LOCAL row_security = off;
      
      -- Compare the project_type column (cast to TEXT) with the input p_type (which is already TEXT)
      RETURN EXISTS (
        SELECT 1 FROM public.project_assignments
        WHERE designer_id = d_id
          AND project_id = p_id
          AND project_type::TEXT = p_type -- Cast column to TEXT for comparison
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN false;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

    COMMENT ON FUNCTION public.is_designer_assigned_to_project IS 'Checks if a designer is assigned to a project, bypassing RLS to avoid infinite recursion';
  END IF;
END
$$;

COMMIT; 