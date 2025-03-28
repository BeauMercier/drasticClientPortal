/**
 * Hook for authentication operations
 * 
 * Provides a simplified API for components to interact with auth functionality
 */

import { useAuthContext } from '../contexts/AuthContext';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ResetPasswordRequest,
  AuthState,
  AuthResult
} from '../types';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  resetPassword as resetPasswordApi,
  updatePassword as updatePasswordApi,
  updateProfile as updateProfileApi
} from '../api';

export interface UseAuthResult {
  // Auth state
  session: AuthState['session'];
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Auth operations
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (data: ResetPasswordRequest) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  updateProfile: (profile: Partial<User>) => Promise<AuthResult>;
}

/**
 * Hook for authentication operations
 * 
 * Provides authentication functionality including sign in, sign out,
 * registration, password management, and profile updates.
 */
export function useAuth(): UseAuthResult {
  const { session, user, isLoading, isAuthenticated, error } = useAuthContext();

  // We're implementing these directly using the API to get the full result objects
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    return await loginApi(credentials);
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    return await registerApi(data);
  };

  const logout = async (): Promise<AuthResult> => {
    return await logoutApi();
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResult> => {
    return await resetPasswordApi(data);
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    return await updatePasswordApi(password);
  };

  const updateProfile = async (profile: Partial<User>): Promise<AuthResult> => {
    return await updateProfileApi(profile);
  };

  return {
    // Auth state
    session,
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // Auth operations
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile
  };
} 