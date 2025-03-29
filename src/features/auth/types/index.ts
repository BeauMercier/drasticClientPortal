/**
 * Auth Types
 * 
 * Contains all type definitions related to authentication and user management.
 */

import type { ReactNode } from 'react';

// Define available user roles
export type UserRole = 'admin' | 'designer' | 'client' | 'guest' | 'partner';

/**
 * Session information with user details
 */
export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: User;
}

/**
 * User information
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
 * Auth state containing session and loading status
 */
export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData extends LoginCredentials {
  full_name: string;
  company?: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Auth context value interface
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (data: ResetPasswordRequest) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  updateProfile: (profile: Partial<User>) => Promise<AuthResult>;
}

/**
 * Auth provider props
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Result of auth operations
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
  session?: any; // Session from Supabase
} 