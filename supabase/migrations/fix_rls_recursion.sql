-- Fix infinite recursion in RLS policies for profiles table
-- This script updates the get_user_role function to avoid recursion

BEGIN;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_role;

-- Create a new version of the function that properly bypasses RLS
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

-- Also fix the is_designer_assigned_to_project function to avoid recursion
DROP FUNCTION IF EXISTS public.is_designer_assigned_to_project;

CREATE OR REPLACE FUNCTION public.is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_designer_assigned_to_project IS 'Checks if a designer is assigned to a project, bypassing RLS to avoid infinite recursion';

-- Run a basic test to ensure the functions work
SELECT public.get_user_role(auth.uid());

COMMIT; 