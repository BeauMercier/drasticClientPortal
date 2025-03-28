-- Fix the RLS policies on the profiles table to prevent infinite recursion

BEGIN;

-- First, get a list of all RLS policies on the profiles table
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable RLS on the profiles table to break the cycle
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Replace problematic policies with simpler versions that don't recursively call get_user_role

-- Drop the policy that's likely causing the recursion
DROP POLICY IF EXISTS "Designers can view client profiles they work with" ON public.profiles;

-- Re-create it with a safer implementation that doesn't use get_user_role()
CREATE POLICY "Designers can view client profiles they work with" 
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Direct check against auth.uid() to prevent recursion
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'designer'
  )
  AND 
  -- Only allow viewing clients that the designer works with
  (role = 'client' AND EXISTS (
    SELECT 1 FROM public.project_assignments pa
    JOIN public.web_design_projects wdp ON pa.project_id = wdp.id AND pa.project_type::TEXT = 'web_design'
    WHERE pa.designer_id = auth.uid() AND wdp.user_id = profiles.id
    UNION ALL
    SELECT 1 FROM public.project_assignments pa
    JOIN public.logo_design_projects ldp ON pa.project_id = ldp.id AND pa.project_type::TEXT = 'logo_design'
    WHERE pa.designer_id = auth.uid() AND ldp.user_id = profiles.id
    UNION ALL
    SELECT 1 FROM public.project_assignments pa
    JOIN public.social_graphics_projects sgp ON pa.project_id = sgp.id AND pa.project_type::TEXT = 'social_graphics'
    WHERE pa.designer_id = auth.uid() AND sgp.user_id = profiles.id
  ))
);

-- Drop the admin policy that might be causing recursion
DROP POLICY IF EXISTS "Admins can access all profiles" ON public.profiles;

-- Re-create with a simpler implementation
CREATE POLICY "Admins can access all profiles" 
ON public.profiles
FOR ALL
TO authenticated
USING (
  -- Direct check against auth.uid() to prevent recursion
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- Re-enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add the default "Users can view own profile" policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" 
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END
$$;

-- Add the default "Users can update own profile" policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" 
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

COMMIT; 