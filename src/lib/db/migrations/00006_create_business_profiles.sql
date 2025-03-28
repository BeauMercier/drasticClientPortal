-- Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  business_type TEXT,
  industry TEXT,
  company_website TEXT,
  
  -- Contact Information
  primary_contact_name TEXT,
  position_title TEXT,
  email_address TEXT,
  phone_number TEXT,
  
  -- Business Address
  street_address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Business Hours
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_closed BOOLEAN DEFAULT TRUE,
  sunday_closed BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on business_profiles
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_profiles

-- Users can view their own business profile
CREATE POLICY "Users can view own business profile"
  ON business_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own business profile
CREATE POLICY "Users can update own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own business profile
CREATE POLICY "Users can insert own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all business profiles
CREATE POLICY "Admins can view all business profiles"
  ON business_profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Admins can update all business profiles
CREATE POLICY "Admins can update all business profiles"
  ON business_profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Designers can view client business profiles
CREATE POLICY "Designers can view client business profiles"
  ON business_profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    id IN (
      SELECT id FROM profiles 
      WHERE role = 'client'
    )
  ); 