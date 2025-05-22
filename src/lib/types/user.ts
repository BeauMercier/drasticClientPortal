/**
 * User Types
 * 
 * This file contains all user-related type definitions.
 */

import { BaseEntity } from './common';
// import { Tables, Enums } from './dbHelpers';
import { Tables } from './dbHelpers';

/**
 * User profile type based on the database schema
 */
export type UserProfile = Tables<'profiles'>;

/**
 * Business profile type based on the database schema
 */
export type BusinessProfile = Tables<'business_profiles'>;

/**
 * Available user roles in the system
 */
export type UserRole = 'admin' | 'designer' | 'client' | 'guest' | 'partner';

/**
 * Extended user type with authentication details
 * This combines auth information with profile data
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication session information
 */
export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}

/**
 * Login credentials for authentication
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for new users
 */
export interface RegisterData extends LoginCredentials {
  full_name: string;
  company?: string;
}

/**
 * Password reset request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Auth operation result interface
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

// User settings
export interface UserSettings {
  id: string;
  user_id: string;
  notification_email: boolean;
  notification_sms: boolean;
  newsletter: boolean;
  theme?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

// Auth related types
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: UserProfile;
  session?: any;
}

// User creation/invitation
export interface UserInvite {
  email: string;
  role: UserRole;
  expires_at: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface UserCreationRequest {
  email: string;
  password?: string;
  role: UserRole;
  full_name?: string;
  company?: string;
  invite_token?: string;
}

// Session with typed user data
export interface SessionWithRole {
  user: {
    id: string;
    email: string;
    role: UserRole;
    user_metadata: {
      role?: UserRole;
      full_name?: string;
    };
  };
}

// Define permissions by role
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_files',
    'manage_billing',
    'access_admin_panel',
    'edit_settings'
  ],
  designer: [
    'view_dashboard',
    'upload_files',
    'manage_files',
    'view_clients'
  ],
  client: [
    'view_dashboard',
    'view_files',
    'download_files',
    'view_billing'
  ],
  guest: [
    'view_dashboard'
  ],
  partner: [
    'view_dashboard',
    'view_files',
    'download_files',
    'upload_files',
    'view_billing'
  ]
};

// Helper function to check permissions
export function hasPermission(
  role: UserRole | undefined, 
  permission: string
): boolean {
  if (!role) return false;
  return rolePermissions[role].includes(permission);
}

// Expanded profile type
export interface Profile extends BaseEntity {
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  business_name: string | null;
  role: UserRole;
  phone: string | null;
} 