/**
 * Projects Types
 * 
 * Contains all types related to project operations.
 */

import { TableRow } from '@/lib/api/schema';

/**
 * Project status options
 */
export type ProjectStatus = 'active' | 'archived' | 'completed' | 'draft';

/**
 * Project member role
 */
export type ProjectRole = 'owner' | 'editor' | 'viewer';

/**
 * Base project interface
 */
export interface Project extends TableRow<'projects'> {
  title?: string;
}

/**
 * Project member interface with extended user information
 */
export interface ProjectMember extends TableRow<'project_members'> {
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Project creation data
 */
export interface ProjectCreateParams {
  name: string;
  description?: string;
  status?: ProjectStatus;
  client_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Project update data
 */
export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  clientId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Project operation result
 */
export interface ProjectResult {
  success: boolean;
  project?: Project;
  error?: string;
}

/**
 * Project list params
 */
export interface ProjectListParams {
  status?: ProjectStatus;
  client_id?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: { ascending: boolean };
} 