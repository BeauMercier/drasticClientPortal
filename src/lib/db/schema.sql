-- Create user profiles table that extends Supabase auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT CHECK (role IN ('admin', 'designer', 'client', 'guest')) DEFAULT 'guest',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security definer function to break recursion in RLS policies
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- Create profiles trigger to automatically create a profile when a user is created
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'guest'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Update the profile when user metadata changes
CREATE OR REPLACE FUNCTION sync_user_role_with_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET role = NEW.raw_user_meta_data->>'role'
  WHERE id = NEW.id AND NEW.raw_user_meta_data->>'role' IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data->>'role' IS DISTINCT FROM NEW.raw_user_meta_data->>'role')
  EXECUTE FUNCTION sync_user_role_with_profile();

-- Set up RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the security definer function

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (role = get_user_role(auth.uid()))
  );

-- 3. Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- 4. Admin can update all profiles including roles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- 5. Designers can view client profiles
CREATE POLICY "Designers can view client profiles"
  ON profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (role = 'client' OR id = auth.uid())
  );

-- Create projects table for role-based access control demo
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
-- 1. Admins have full access
CREATE POLICY "Admins have full access to projects"
  ON projects
  USING (get_user_role(auth.uid()) = 'admin');

-- 2. Designers can view and update projects they created or are assigned to clients they manage
CREATE POLICY "Designers can access their projects"
  ON projects FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (created_by = auth.uid() OR client_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

-- 3. Clients can only view their projects
CREATE POLICY "Clients can view their projects"
  ON projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    client_id = auth.uid()
  );

-- Admin function to update user roles (for RPC)
CREATE OR REPLACE FUNCTION admin_update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the role is valid
  IF new_role NOT IN ('admin', 'designer', 'client', 'guest') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', to_jsonb(new_role))
  WHERE id = user_id;

  -- Update will cascade to profiles via the trigger
  
  RETURN TRUE;
END;
$$; 