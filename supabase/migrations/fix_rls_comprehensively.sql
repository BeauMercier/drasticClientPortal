-- Comprehensive fix for RLS recursion issues
-- This properly redesigns the helper functions and policies to avoid recursion

BEGIN;

------------------------------------------
-- PART 1: Create direct role access function
------------------------------------------

-- Create a function that gets role directly from auth.users instead of profiles
-- This is the key to breaking the recursion
CREATE OR REPLACE FUNCTION public.get_auth_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role directly from auth.users metadata (bypasses profiles table)
  SELECT COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
  INTO user_role
  FROM auth.users
  WHERE id = user_id;

  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_auth_role IS 'Gets user role directly from auth.users metadata, avoiding profiles table recursion';

------------------------------------------
-- PART 2: Fix existing helper functions
------------------------------------------

-- Update get_user_role to use the non-recursive version
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- Call the non-recursive function
  RETURN public.get_auth_role(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role IS 'Safely gets user role without causing RLS recursion';

-- Fix is_designer_assigned_to_project function
CREATE OR REPLACE FUNCTION public.is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_assigned BOOLEAN;
BEGIN
  -- Set security context to avoid RLS issues
  SET LOCAL search_path TO '';

  -- Explicitly bypass RLS for this query
  SET LOCAL row_security = off;
  
  -- Check if designer is assigned to project
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE designer_id = d_id
      AND project_id = p_id
      AND project_type::TEXT = p_type
  ) INTO is_assigned;

  RETURN is_assigned;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_designer_assigned_to_project IS 'Checks if designer is assigned to a project without causing RLS recursion';

------------------------------------------
-- PART 3: Update RLS policies on profiles
------------------------------------------

-- First, get list of all profiles policies to review
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable RLS to update policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop and recreate problematic policies using the non-recursive function
DROP POLICY IF EXISTS "Designers can view client profiles they work with" ON public.profiles;
DROP POLICY IF EXISTS "Admins can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Admin policy using direct role check from auth.users
CREATE POLICY "Admins can access all profiles" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  public.get_auth_role(auth.uid()) = 'admin'
);

-- Designer policy to view clients they work with
CREATE POLICY "Designers can view client profiles they work with" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Check if user is designer using non-recursive function
  public.get_auth_role(auth.uid()) = 'designer'
  AND 
  -- Only allow viewing clients that designer works with
  (role = 'client' AND EXISTS (
    SELECT 1 FROM public.project_assignments pa
    WHERE pa.designer_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.web_design_projects wdp 
              WHERE pa.project_id = wdp.id 
              AND pa.project_type::TEXT = 'web_design' 
              AND wdp.user_id = profiles.id)
      OR 
      EXISTS (SELECT 1 FROM public.logo_design_projects ldp 
              WHERE pa.project_id = ldp.id 
              AND pa.project_type::TEXT = 'logo_design' 
              AND ldp.user_id = profiles.id)
      OR
      EXISTS (SELECT 1 FROM public.social_graphics_projects sgp 
              WHERE pa.project_id = sgp.id 
              AND pa.project_type::TEXT = 'social_graphics' 
              AND sgp.user_id = profiles.id)
    )
  ))
);

-- Base user policies - simpler and safer
CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

------------------------------------------
-- PART 4: Verify solution
------------------------------------------

-- Test our non-recursive function works
SELECT public.get_auth_role(auth.uid()) as current_user_role;

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'RLS recursion fix completed successfully.';
  RAISE NOTICE 'Helper functions have been redesigned to avoid recursion.';
  RAISE NOTICE 'Profiles table policies have been updated to use safe functions.';
END $$;

COMMIT; 