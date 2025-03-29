'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Session, 
  AuthContextValue, 
  AuthProviderProps,
  LoginCredentials,
  RegisterData,
  ResetPasswordRequest,
  User,
  AuthResult,
  UserRole
} from '../types';
import { 
  login as loginApi, 
  logout as logoutApi,
  register as registerApi,
  resetPassword as resetPasswordApi,
  updatePassword as updatePasswordApi,
  updateProfile as updateProfileApi,
  getCurrentSession
} from '../api';
import supabase from '@/lib/api/client';
import { Session as SupabaseSession } from '@supabase/supabase-js';
import { getEnv, validateEnv } from '@/lib/env';
import { handleRefreshTokenError } from '@/lib/supabase/auth-helpers';

// Create the auth context with default values
const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false })
});

// Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  // Check for environment variables on component mount
  useEffect(() => {
    try {
      // Validate environment variables
      const { valid, missing } = validateEnv();
      if (!valid) {
        console.error(`Missing environment variables: ${missing.join(', ')}`);
        setEnvError(`Missing environment variables: ${missing.join(', ')}`);
        
        // Try to get env vars from window.__NEXT_DATA__ if available
        if (typeof window !== 'undefined' && window.__NEXT_DATA__?.runtimeConfig) {
          console.log('Attempting to use runtime config from Next.js');
          // The env.ts module should have already attempted to set these values
        }
      } else {
        setEnvError(null);
      }
    } catch (err) {
      console.error('Environment validation error:', err);
      setEnvError('Failed to validate environment variables');
    }
  }, []);

  useEffect(() => {
    // Initialize the auth state
    const initAuth = async () => {
      try {
        // Skip auth initialization if environment variables are missing
        if (envError) {
          console.error('Skipping auth initialization due to environment error');
          setIsLoading(false);
          return;
        }

        const { success, session: currentSession, error } = await getCurrentSession();
        
        if (success && currentSession) {
          // Cast the session to our Session type and set it
          setSession(currentSession as unknown as Session);
          
          // Extract user data from session
          if (currentSession.user) {
            const userRole = (currentSession.user.user_metadata?.role || 'client') as UserRole;
            const userData: User = {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              role: userRole,
              full_name: currentSession.user.user_metadata?.full_name,
              avatar_url: currentSession.user.user_metadata?.avatar_url,
              metadata: currentSession.user.user_metadata
            };
            setUser(userData);
          }
        } else if (error) {
          // Check for refresh token errors
          if (handleRefreshTokenError(error)) {
            // Error already handled by the helper function
            console.log('Auth initialization failed due to refresh token error');
          } else {
            // Handle other errors
            setError(error);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        
        // Also check if this is a refresh token error
        if (err instanceof Error && handleRefreshTokenError(err)) {
          // Error already handled
        } else {
          setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes if no environment error
    if (!envError) {
      try {
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event: string, newSession: SupabaseSession | null) => {
            console.log(`Auth state changed: ${event}`);
            
            if (newSession && newSession.user) {
              // Cast the session to our Session type and set it
              setSession(newSession as unknown as Session);
              
              // Extract user data from session
              const userRole = (newSession.user.user_metadata?.role || 'client') as UserRole;
              const userData: User = {
                id: newSession.user.id,
                email: newSession.user.email || '',
                role: userRole,
                full_name: newSession.user.user_metadata?.full_name,
                avatar_url: newSession.user.user_metadata?.avatar_url,
                metadata: newSession.user.user_metadata
              };
              setUser(userData);
            } else {
              // Clear session and user when logged out
              setSession(null);
              setUser(null);
            }
          }
        );

        // Cleanup subscription
        return () => {
          if (authListener?.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error("Failed to initialize Supabase auth listener:", error);
        return () => {}; // Return empty cleanup function if initialization fails
      }
    }
    // Return empty cleanup function if environment error
    return () => {};
  }, [envError]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call login API with a callback to immediately update state
      const result = await loginApi(credentials, (session, user) => {
        // Immediately update state without waiting for onAuthStateChange
        console.log('Immediately updating auth state after successful login');
        setSession(session);
        setUser(user);
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to login');
      }
      
      return result;
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await registerApi(data);
      
      if (!result.success) {
        setError(result.error || 'Failed to register');
      }
      
      return result;
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await logoutApi();
      
      if (!result.success) {
        setError(result.error || 'Failed to logout');
        setIsLoading(false);
        return result;
      }
      
      // Force clear local auth state immediately
      setSession(null);
      setUser(null);
      
      // For complete logout, manually redirect to login page
      if (typeof window !== 'undefined') {
        // Small delay to allow cookies to clear
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      return result;
    } catch (err) {
      console.error("Logout error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Reset password function
  const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await resetPasswordApi(data);
      
      if (!result.success) {
        setError(result.error || 'Failed to reset password');
      }
      
      return result;
    } catch (err) {
      console.error("Reset password error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
  const updatePassword = async (password: string): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updatePasswordApi(password);
      
      if (!result.success) {
        setError(result.error || 'Failed to update password');
      }
      
      return result;
    } catch (err) {
      console.error("Update password error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profile: Partial<User>): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updateProfileApi(profile);
      
      if (!result.success) {
        setError(result.error || 'Failed to update profile');
      } else if (result.user) {
        setUser(result.user);
      }
      
      return result;
    } catch (err) {
      console.error("Update profile error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the auth context value
  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    error,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export const useAuthContext = () => useContext(AuthContext); 