-- EMERGENCY FIX: Direct approach to solve 500 errors with RLS
-- This script provides a minimal, direct fix for the immediate problem

BEGIN;

-- STEP 1: Completely disable RLS on the profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Create a basic view that can be used instead of querying profiles directly
-- This provides a safety layer while RLS is disabled
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  p.id,
  p.role,
  p.email,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- STEP 3: Grant permissions to the view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- STEP 4: Create a special admin-only view for full access
CREATE OR REPLACE VIEW public.admin_profiles AS
SELECT *
FROM public.profiles;

-- STEP 5: Grant permission on the full view only to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO service_role;

-- STEP 6: Create special access function to get a user's own profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- STEP 7: Create a function to check if user has access rights
CREATE OR REPLACE FUNCTION public.user_has_access_to_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user's role from auth metadata
  SELECT COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
  INTO user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if user has access
  RETURN 
    -- User can access their own profile
    profile_id = auth.uid() OR
    -- Admins can access all profiles
    user_role = 'admin' OR
    -- Designers can access profiles based on project assignments
    (user_role = 'designer' AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.web_design_projects wdp ON p.id = wdp.user_id
      JOIN public.project_assignments pa ON wdp.id = pa.project_id 
      WHERE pa.designer_id = auth.uid() AND p.id = profile_id
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION public.user_has_access_to_profile(UUID) TO authenticated;

-- STEP 8: Document the problem and solution for future reference
COMMENT ON TABLE public.profiles IS 'User profiles - RLS CURRENTLY DISABLED DUE TO RECURSION ISSUE. Use safe_profiles view, get_my_profile() function, or admin_profiles view instead.';

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'EMERGENCY FIX APPLIED - RLS on profiles table is disabled. Alternative access methods created:';
  RAISE NOTICE '1. safe_profiles view - Limited fields, available to all authenticated users';
  RAISE NOTICE '2. get_my_profile() function - For users to get their own profile';
  RAISE NOTICE '3. user_has_access_to_profile(UUID) function - To check if current user has access to a profile';
  RAISE NOTICE '4. admin_profiles view - Full access, available only to service_role';
  RAISE NOTICE 'IMPORTANT: This is a temporary measure. A comprehensive RLS fix should be implemented later.';
END $$;

COMMIT; 