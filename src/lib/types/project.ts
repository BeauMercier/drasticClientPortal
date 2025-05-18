/**
 * Project Types
 * 
 * This file contains all project-related type definitions.
 */

import { BaseEntity } from './common';
import { Tables, ProjectRow, ProjectTableName, Enums } from './dbHelpers';

// Project status types
export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';

// Project type types
export type ProjectType = 'web_design' | 'logo_design' | 'social_graphics';

// Social media related types
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'other';
export type ContentType = 'post' | 'story' | 'banner' | 'profile' | 'ad' | 'other';

// Website related types
export type SSLStatus = 'active' | 'expired' | 'none';
export type CampaignStatus = 'active' | 'paused' | 'removed';
export type AnalyticsService = 'google_analytics' | 'matomo' | 'plausible' | 'other';

// Type for the client profile data fetched in API routes
export type ClientProfileData = {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
} | null;

// Main Project interface
export interface Project {
  id: string;
  title: string;
  name?: string;
  description?: string | null;
  user_id: string;
  client: ClientProfileData;
  status: string;
  current_stage?: string | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Project file interface for the project detail page
export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  project_id: string;
  upload_date: string;
  uploaded_by: string;
}

// Project details interface for the project detail page
export interface ProjectDetails {
  id: string;
  title: string;
  name?: string; // TODO: name will be removed after migration
  description: string;
  status: string;
  client_name: string;
  created_at: string;
  updated_at: string;
  project_type: string;
  deadline?: string;
  [key: string]: string | number | boolean | undefined; // Better typing for dynamic fields
}

// Project note
export interface ProjectNote {
  id: string;
  content: string;
  project_id: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
}

// Project interfaces by type
export interface WebDesignProject extends Tables<'web_design_projects'> {
  name: string;
  client: ClientProfileData;
  client_name: string | null;
  due_date: string | null;

  user_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  project_type: 'web_design';
  current_stage: ProjectStage | null;
  site_type: string | null;
  domain_name: string | null;
  hosting_provider: string | null;
  expected_launch_date: string | null;
  discovery_date: string | null;
  concept_development_date: string | null;
  refinement_date: string | null;
  finalization_date: string | null;
  delivery_date: string | null;
}

export interface SocialGraphicsProject extends Tables<'social_graphics_projects'> {
  client?: ClientProfileData;
  user_id: string;
  title: string;
  description: string | null;
  social_platform: SocialPlatform;
  content_type: ContentType;
  status: ProjectStatus;
  dimensions: string | null;
}

export interface LogoDesignProject extends Tables<'logo_design_projects'> {
  client?: ClientProfileData;
  user_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  industry: string | null;
  color_preferences: string | null;
  style_preferences: string | null;
}

// Management interfaces
export interface WebsiteManagement extends BaseEntity {
  user_id: string;
  domain_name: string;
  hosting_provider: string | null;
  ssl_status: SSLStatus | null;
  cms_type: string | null;
  monthly_maintenance: boolean;
  renewal_date: string | null;
  notes: string | null;
}

export interface GoogleAdsManagement extends BaseEntity {
  user_id: string;
  ads_account_id: string | null;
  monthly_budget: number | null;
  campaign_status: CampaignStatus | null;
  start_date: string | null;
  end_date: string | null;
  primary_keywords: string[] | null;
  target_audience: string | null;
  notes: string | null;
}

export interface AnalyticsManagement extends BaseEntity {
  user_id: string;
  analytics_service: AnalyticsService | null;
  property_id: string | null;
  connected_at: string | null;
  tracking_code: string | null;
  notes: string | null;
}

// Revision system types
export type RevisionStatus = Enums<'revision_status'>;
export type ProjectTypeForRevision = Enums<'project_type_for_revision'>;
export type MockupType = 'image' | 'figma' | 'wordpress' | 'other';

export interface ProjectRevision extends Tables<'project_revisions'> {
  project_id: string;
  project_type: ProjectTypeForRevision;
  version: number;
  title: string;
  description: string | null;
  status: RevisionStatus;
  feedback: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface RevisionFile extends BaseEntity {
  revision_id: string;
  file_path?: string | null;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  mockup_type: MockupType;
  preview_url: string | null;
  uploaded_by: string | null;
}

// Project stages for the timeline
export type ProjectStage = 'discovery' | 'concept-development' | 'refinement' | 'finalization' | 'delivery';

// Interface for active client projects for the dashboard
export interface ActiveClientProject {
  id: string;
  title: string;
  project_type: string;
  status: ProjectStatus;
  current_stage: ProjectStage | null;
  discovery_date: string | null;
  concept_development_date: string | null;
  refinement_date: string | null;
  finalization_date: string | null;
  delivery_date: string | null;
  // Add other relevant fields like thumbnail_url if needed for cards
  thumbnail_url?: string | null;
}

// Designer project assignment
export type DesignerProject = Tables<'designer_projects'>;

// Project list parameters for filtering
export interface ProjectListParams {
  type?: ProjectType;
  status?: ProjectStatus;
  client_id?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: { ascending: boolean };
}

// Project creation parameters
export interface ProjectCreateParams {
  title: string;
  name?: string;
  description?: string;
  type: ProjectType;
  client_id: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
}

// Project update parameters
export interface UpdateProjectData {
  title?: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  current_stage?: ProjectStage;
  [key: string]: unknown;
}

// Project operation result
export interface ProjectResult {
  success: boolean;
  project?: Project;
  error?: string;
} 