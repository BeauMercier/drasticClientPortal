-- Enhanced Schema for Drastic Client Portal
-- This builds upon the existing schema with additional tables and relationships

-- Enhance the profiles table with additional fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;

-- ============ PROJECT TABLES ============

-- Web Design Projects
CREATE TABLE IF NOT EXISTS web_design_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  status TEXT NOT NULL,
  thumbnail_url TEXT,
  current_stage TEXT DEFAULT 'discovery' CHECK (current_stage IN ('discovery', 'concept-development', 'refinement', 'finalization', 'delivery')),
  discovery_date TIMESTAMP WITH TIME ZONE,
  concept_development_date TIMESTAMP WITH TIME ZONE,
  refinement_date TIMESTAMP WITH TIME ZONE,
  finalization_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social Graphics Projects
CREATE TABLE IF NOT EXISTS social_graphics_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  social_platform TEXT CHECK (social_platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'other')),
  content_type TEXT CHECK (content_type IN ('post', 'story', 'banner', 'profile', 'ad', 'other')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')) DEFAULT 'pending',
  dimensions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logo Design Projects
CREATE TABLE IF NOT EXISTS logo_design_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')) DEFAULT 'pending',
  industry TEXT,
  color_preferences TEXT,
  style_preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ MANAGEMENT TABLES ============

-- Website Management
CREATE TABLE IF NOT EXISTS management_website (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  hosting_provider TEXT,
  ssl_status TEXT CHECK (ssl_status IN ('active', 'expired', 'none')),
  cms_type TEXT,
  monthly_maintenance BOOLEAN DEFAULT FALSE,
  renewal_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google Ads Management
CREATE TABLE IF NOT EXISTS management_google_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ads_account_id TEXT,
  monthly_budget NUMERIC,
  campaign_status TEXT CHECK (campaign_status IN ('active', 'paused', 'removed')),
  start_date DATE,
  end_date DATE,
  primary_keywords TEXT[],
  target_audience TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Management
CREATE TABLE IF NOT EXISTS management_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analytics_service TEXT CHECK (analytics_service IN ('google_analytics', 'matomo', 'plausible', 'other')),
  property_id TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  tracking_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ BILLING ============

-- Billing Invoices
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'failed')) DEFAULT 'pending',
  invoice_number TEXT,
  description TEXT,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ FILES ============

-- User Files
CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('web_design', 'social_graphics', 'logo_design', 'general', 'other')),
  project_id UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ SUPPORT ============

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ ROW LEVEL SECURITY ============

-- Enable RLS on all new tables
ALTER TABLE web_design_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_graphics_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_design_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_website ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_google_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for web_design_projects
CREATE POLICY "Admins full access to web_design_projects"
  ON web_design_projects
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access their web_design_projects"
  ON web_design_projects FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can view their web_design_projects"
  ON web_design_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Similar policies for other project tables
CREATE POLICY "Admins full access to social_graphics_projects"
  ON social_graphics_projects
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access their social_graphics_projects"
  ON social_graphics_projects FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can view their social_graphics_projects"
  ON social_graphics_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

CREATE POLICY "Admins full access to logo_design_projects"
  ON logo_design_projects
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access their logo_design_projects"
  ON logo_design_projects FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can view their logo_design_projects"
  ON logo_design_projects FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Policies for management tables
CREATE POLICY "Admins full access to management_website"
  ON management_website
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access client management_website"
  ON management_website FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can view their management_website"
  ON management_website FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Similar policies for other management tables
-- (Policies for Google Ads and Analytics would follow the same pattern)

-- Policies for billing
CREATE POLICY "Admins full access to billing_invoices"
  ON billing_invoices
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Clients can view their billing_invoices"
  ON billing_invoices FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Policies for files
CREATE POLICY "Admins full access to user_files"
  ON user_files
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access their user_files"
  ON user_files FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can access their user_files"
  ON user_files FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Policies for support tickets
CREATE POLICY "Admins full access to support_tickets"
  ON support_tickets
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Designers can access assigned support_tickets"
  ON support_tickets FOR ALL
  USING (
    get_user_role(auth.uid()) = 'designer' AND
    (assigned_to = auth.uid() OR user_id IN (
      SELECT id FROM profiles WHERE role = 'client'
    ))
  );

CREATE POLICY "Clients can view their support_tickets"
  ON support_tickets FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

CREATE POLICY "Clients can create support_tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) = 'client' AND
    user_id = auth.uid()
  );

-- Policies for support messages
CREATE POLICY "Admins full access to support_messages"
  ON support_messages
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view messages for their tickets"
  ON support_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid() OR assigned_to = auth.uid()
    ) AND
    sender_id = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_web_design_projects_user_id ON web_design_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_social_graphics_projects_user_id ON social_graphics_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_logo_design_projects_user_id ON logo_design_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_management_website_user_id ON management_website(user_id);
CREATE INDEX IF NOT EXISTS idx_management_google_ads_user_id ON management_google_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_management_analytics_user_id ON management_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);

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