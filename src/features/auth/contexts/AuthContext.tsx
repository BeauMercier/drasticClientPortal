'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  // Removed getCurrentSession as we rely on onAuthStateChange now
} from '../api';
import supabase from '@/lib/api/client';
import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { getEnv, validateEnv } from '@/lib/env';
import { handleRefreshTokenError } from '@/lib/supabase/auth-helpers';

// --- Helper Function to Map Supabase Session/User to Local Types ---
const mapSupabaseSessionToLocal = (supabaseSession: SupabaseSession | null): { localSession: Session | null, localUser: User | null } => {
  if (!supabaseSession || !supabaseSession.user) {
    return { localSession: null, localUser: null };
  }

  const supabaseUser: SupabaseUser = supabaseSession.user;

  // --- Throw error if email is missing --- 
  if (!supabaseUser.email) {
    // In a real app, consider throwing a specific error type
    throw new Error('Supabase user object missing email.');
  }
  // --- Email is guaranteed to be a string after this point ---

  // Extract role safely, defaulting to 'client'
  let userRole: UserRole = 'client';
  const metaRole = supabaseUser.app_metadata?.role;
  const topLevelRole = supabaseUser.role;
  if (metaRole && typeof metaRole === 'string' && ['admin', 'designer', 'client', 'partner'].includes(metaRole)) {
    userRole = metaRole as UserRole;
  } else if (topLevelRole && typeof topLevelRole === 'string' && ['admin', 'designer', 'client', 'partner'].includes(topLevelRole)) {
    userRole = topLevelRole as UserRole;
  }

  // Construct the local User object
  const localUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email, // Known string
    role: userRole,
    full_name: supabaseUser.user_metadata?.full_name || undefined,
    avatar_url: supabaseUser.user_metadata?.avatar_url || undefined,
    metadata: { ...supabaseUser.app_metadata, ...supabaseUser.user_metadata },
  };

  // Construct the local Session object
  const localSession: Session = {
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
    expires_at: supabaseSession.expires_at || undefined,
    user: localUser, // No cast needed here due to explicit localUser construction
  };

  return { localSession, localUser };
};
// --- End Helper Function ---

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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  // Check for environment variables on component mount
  useEffect(() => {
    // This effect remains the same as before
    try {
      const { valid, missing } = validateEnv();
      if (!valid) {
        console.error(`Missing environment variables: ${missing.join(', ')}`);
        setEnvError(`Missing environment variables: ${missing.join(', ')}`);
        if (typeof window !== 'undefined' && window.__NEXT_DATA__?.runtimeConfig) {
          console.log('Attempting to use runtime config from Next.js');
        }
      } else {
        setEnvError(null);
      }
    } catch (err) {
      console.error('Environment validation error:', err);
      setEnvError('Failed to validate environment variables');
    }
  }, [validateEnv, setEnvError]);

  // *** MODIFIED UseEffect Hook ***
  useEffect(() => {
    // Skip auth initialization if environment variables are missing
    if (envError) {
      console.error('Skipping auth initialization due to environment error');
      setIsLoading(false); // Stop loading if env fails
      return;
    }

    let isMounted = true; // Track mount status for cleanup
    let receivedInitialAuthEvent = false; // Track if the first event was received

    console.log('Setting up Supabase auth listener...');

    // Subscribe to auth changes
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event: string, newSession: SupabaseSession | null) => {
          if (!isMounted) return;
          console.log(`Auth state changed: ${event}, Session: ${newSession ? 'present' : 'null'}`);
          
          // If the event is USER_UPDATED, try to get the user fresh
          if (event === 'USER_UPDATED' && newSession) {
            supabase.auth.getUser()
              .then(({ data: { user: freshlyFetchedUser }, error: fetchError }) => {
                if (!isMounted) return; // Check mount status again inside promise
                if (fetchError) {
                  console.error("Error explicitly fetching user on USER_UPDATED event:", fetchError);
                  // Fallback to mapping the session from the event
                  try {
                    const { localSession, localUser } = mapSupabaseSessionToLocal(newSession);
                    setSession(localSession);
                    setUser(localUser);
                  } catch (mapError) {
                     console.error("Error mapping Supabase session (USER_UPDATED fallback):", mapError);
                     setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
                     setSession(null);
                     setUser(null);
                  }
                } else if (freshlyFetchedUser) {
                  console.log("USER_UPDATED event: Using explicitly fetched user data.");
                  // Construct a new session object with the freshly fetched user
                  const sessionWithFreshUser: SupabaseSession = {
                    ...newSession,
                    user: freshlyFetchedUser // Override with the fresh user
                  };
                  try {
                    const { localSession, localUser } = mapSupabaseSessionToLocal(sessionWithFreshUser);
                    setSession(localSession);
                    setUser(localUser);
                  } catch (mapError) {
                    console.error("Error mapping Supabase session (USER_UPDATED fresh fetch):", mapError);
                    setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
                    setSession(null);
                    setUser(null);
                  }
                } else {
                  // Fallback if freshlyFetchedUser is null for some reason
                  console.log("USER_UPDATED event: freshlyFetchedUser was null, falling back.");
                  try {
                    const { localSession, localUser } = mapSupabaseSessionToLocal(newSession);
                    setSession(localSession);
                    setUser(localUser);
                  } catch (mapError) {
                    console.error("Error mapping Supabase session (USER_UPDATED null fresh user fallback):", mapError);
                    setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
                    setSession(null);
                    setUser(null);
                  }
                }
              })
              .catch(err => {
                if (!isMounted) return;
                console.error("Exception during explicit user fetch on USER_UPDATED:", err);
                // Fallback to mapping the session from the event on critical error
                try {
                  const { localSession, localUser } = mapSupabaseSessionToLocal(newSession);
                  setSession(localSession);
                  setUser(localUser);
                } catch (mapError) {
                    console.error("Error mapping Supabase session (USER_UPDATED catch fallback):", mapError);
                    setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
                    setSession(null);
                    setUser(null);
                }
              })
              .finally(() => {
                 if (!isMounted) return;
                 if (!receivedInitialAuthEvent) {
                    console.log('Auth initial state determined by onAuthStateChange (USER_UPDATED path).');
                    setIsLoading(false);
                    receivedInitialAuthEvent = true;
                  }
              });
          } else {
            // For all other events, or if newSession is null for USER_UPDATED before fetch logic
            try {
              const { localSession, localUser } = mapSupabaseSessionToLocal(newSession);
              setSession(localSession);
              setUser(localUser);
            } catch (mapError) {
              console.error("Error mapping Supabase session:", mapError);
              setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
              // Clear session/user on mapping error (e.g., missing email)
              setSession(null);
              setUser(null);
            }
    
            // Stop loading *after* the first event is processed (or if not USER_UPDATED)
            if (!receivedInitialAuthEvent) {
              console.log('Auth initial state determined by onAuthStateChange (other events or initial USER_UPDATED before fetch).');
              setIsLoading(false);
              receivedInitialAuthEvent = true;
            }
          }
        }
      );

      // Cleanup subscription
      return () => {
        isMounted = false;
        if (authListener?.subscription) {
          console.log('Unsubscribing from auth state changes.');
          authListener.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Failed to initialize Supabase auth listener:", error);
      if (isMounted) {
        setError('Failed to initialize auth listener');
        setIsLoading(false); // Stop loading on error
      }
      return () => {}; // Return empty cleanup function if initialization fails
    }
  }, [envError, supabase, mapSupabaseSessionToLocal, setSession, setUser, setError, setIsLoading]);


  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call login API which now returns SupabaseSession
      const result = await loginApi(credentials /* Removed onSuccess callback for now */ );

      // Check result from loginApi before mapping
      if (!result.success || !result.session) {
         setError(result.error || 'Failed to login');
         setIsLoading(false);
         return result;
      }
      
      // Map the session returned by loginApi
      try {
          // Note: loginApi's AuthResult uses session: any. We need to cast it before mapping.
          const supabaseSession = result.session as SupabaseSession; 
          const { localSession, localUser } = mapSupabaseSessionToLocal(supabaseSession);
          console.log('Immediately updating auth state after successful login map');
          setSession(localSession);
          setUser(localUser);
          setIsLoading(false);
          // Modify AuthResult to return mapped User if needed, or stick to Supabase types?
          // For now, let's return the original AuthResult structure
          // If AuthResult needs the local User type, update its definition in types/index.ts
          // Ensure we return User | undefined to match AuthResult type
          return { ...result, user: localUser || undefined }; // Optionally include mapped user in return
      } catch (mapError) {
          console.error("Error mapping Supabase session after login:", mapError);
          setError(mapError instanceof Error ? mapError.message : 'Failed to process user session after login.');
          setSession(null); // Clear session on mapping error
          setUser(null);
          setIsLoading(false);
          // Return failure - Use mapError here
          return { success: false, error: mapError instanceof Error ? mapError.message : 'Mapping failed' };
      }

    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false); // Set loading false on catch

      return {
        success: false,
        error: errorMessage
      };
    }
    // No finally block needed as loading is handled in all paths
  };

  // Register function
  const register = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true); // Set loading true at the start
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
      setIsLoading(false); // Ensure loading is false after registration attempt
    }
  };

  // Logout function
  const logout = async (): Promise<AuthResult> => {
    setIsLoading(true); // Set loading true
    setError(null);

    try {
      const result = await logoutApi();

      if (!result.success) {
        setError(result.error || 'Failed to logout');
        setIsLoading(false); // Set loading false on failure
        return result;
      }

      // State clearing happens via onAuthStateChange now, but forcing immediate clear can improve UX
      console.log('Immediately clearing local auth state after successful logout call');
      setSession(null);
      setUser(null);
      setIsLoading(false); // Ensure loading is false after local state clear


      // Redirect can happen after state is cleared locally
      if (typeof window !== 'undefined') {
        // Small delay might still be useful for Supabase background processes
        setTimeout(() => {
          window.location.href = '/login';
        }, 50);
      }

      return result;
    } catch (err) {
      console.error("Logout error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false); // Ensure loading is false on catch

      return {
        success: false,
        error: errorMessage
      };
    }
  };


  // Reset password function
  const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResult> => {
    setIsLoading(true); // Set loading true
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
      setIsLoading(false); // Ensure loading is false after attempt
    }
  };

  // Update password function
  const updatePassword = async (password: string): Promise<AuthResult> => {
    setIsLoading(true); // Set loading true
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
      setIsLoading(false); // Ensure loading is false after attempt
    }
  };

  // Update profile function
  const updateProfile = async (profile: Partial<User>): Promise<AuthResult> => {
    setIsLoading(true); // Set loading true
    setError(null);

    try {
      const result = await updateProfileApi(profile);

      if (!result.success) {
        setError(result.error || 'Failed to update profile');
      } else if (result.user) {
        // Update local user state immediately for better UX
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
      setIsLoading(false); // Ensure loading is false after attempt
    }
  };


  // Provide the auth context value
  const contextValue: AuthContextValue = {
    session,
    user,
    isLoading, // isLoading is now true until first onAuthStateChange
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