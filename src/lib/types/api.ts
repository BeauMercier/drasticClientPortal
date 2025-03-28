// Admin API Types

export type UserRole = 'admin' | 'designer' | 'client' | 'guest' | 'partner';

// User object as returned from the admin users API
export interface ApiUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  company?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: Record<string, unknown>;
}

// Project status options
export type ProjectStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// Project object as returned from the admin projects API
export interface ApiProject {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  client_name?: string;
  status: ProjectStatus;
  created_at: string;
  deadline?: string;
}

// Generic API response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
} 