'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { validateEnv } from '@/lib/env';
// import { handleRefreshTokenError } from '@/lib/supabase/auth-helpers';

// Helper function to check if a string is a valid UserRole (moved/duplicated here for self-containment)
function isValidUserRole(role: string | undefined | null): role is UserRole {
  if (!role) return false;
  return ['admin', 'designer', 'client', 'guest', 'partner'].includes(role);
}

// --- Helper Function to Map Supabase Session/User to Local Types ---
const mapSupabaseSessionToLocal = (
  supabaseSession: SupabaseSession | null,
  currentUser: User | null,
  event: string | null
): { localSession: Session | null, localUser: User | null } => {
  if (!supabaseSession || !supabaseSession.user) {
    console.log('[AuthContext] mapSupabaseSessionToLocal: Supabase session or user is null.');
    return { localSession: null, localUser: null };
  }

  const supabaseUser: SupabaseUser = supabaseSession.user;
  console.log('[AuthContext] mapSupabaseSessionToLocal: Received supabaseUser:', JSON.parse(JSON.stringify(supabaseUser)));

  if (!supabaseUser.email) {
    throw new Error('Supabase user object missing email.');
  }

  // Extract role safely
  let determinedUserRole: UserRole | undefined = undefined; 
  const appMetaRole = supabaseUser.app_metadata?.role as UserRole | undefined; 
  const userMetaRole = supabaseUser.user_metadata?.role as UserRole | undefined;

  console.log('[AuthContext] mapSupabaseSessionToLocal - Roles found: appMetaRole:', appMetaRole, 'userMetaRole:', userMetaRole);

  // Priority 1: app_metadata.role 
  if (appMetaRole && isValidUserRole(appMetaRole)) { 
    determinedUserRole = appMetaRole;
  } 
  // Priority 2: user_metadata.role 
  else if (userMetaRole && isValidUserRole(userMetaRole)) {
    determinedUserRole = userMetaRole;
    console.warn(`[AuthContext] Used role from user_metadata ('${userMetaRole}') as app_metadata.role was invalid or missing.`);
  }
  
  // Fallback if no valid role is found in metadata
  if (!determinedUserRole) {
    console.warn(`[AuthContext] No valid role found in app_metadata or user_metadata. Defaulting to 'guest'. Supabase user role: ${supabaseUser.role}`);
    determinedUserRole = 'guest'; 
  }

  console.log('[AuthContext] mapSupabaseSessionToLocal - Determined userRole:', determinedUserRole);

  let resolvedAvatarUrl = supabaseUser.user_metadata?.avatar_url;

  if (event === 'USER_UPDATED') {
    if (currentUser?.avatar_url && !supabaseUser.user_metadata?.avatar_url) {
      console.warn(`[AuthContext] USER_UPDATED event: supabaseUser.user_metadata.avatar_url is missing, but currentUser.avatar_url (${currentUser.avatar_url}) exists. Retaining currentUser.avatar_url.`);
      resolvedAvatarUrl = currentUser.avatar_url;
    } else if (currentUser?.avatar_url && supabaseUser.user_metadata?.avatar_url && currentUser.avatar_url !== supabaseUser.user_metadata.avatar_url) {
      console.log(`[AuthContext] USER_UPDATED event: avatar_url changed from ${currentUser.avatar_url} to ${supabaseUser.user_metadata.avatar_url}. Using new one from event.`);
      // resolvedAvatarUrl already has the new one from supabaseUser
    } else if (!currentUser?.avatar_url && supabaseUser.user_metadata?.avatar_url) {
      console.log(`[AuthContext] USER_UPDATED event: currentUser had no avatar, new event has ${supabaseUser.user_metadata.avatar_url}. Using new one.`);
      // resolvedAvatarUrl already has the new one from supabaseUser
    }
  }

  // Construct the local User object
  const localUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email, 
    role: determinedUserRole, // Use the clearly determined role
    full_name: supabaseUser.user_metadata?.full_name || undefined,
    avatar_url: resolvedAvatarUrl || undefined,
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
  const router = useRouter();

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
    if (envError) {
      console.error('Skipping auth initialization due to environment error');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let receivedInitialAuthEvent = false;

    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event: string, newSession: SupabaseSession | null) => {
          if (!isMounted) return;
          
          console.log('[AuthContext] onAuthStateChange event:', event, 'newSession:', newSession ? "Exists" : "Null"); // Log event and session status

          if (event === 'PASSWORD_RECOVERY') {
            console.log('[AuthContext] PASSWORD_RECOVERY event detected. Redirecting to /update-password.');
            router.replace('/update-password');
            // Clean up hash after redirecting for password recovery
            if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
              console.log('[AuthContext] Cleaning up URL hash after password recovery.');
              history.replaceState({}, document.title, window.location.pathname + window.location.search);
            }
            // We might not want to immediately setIsLoading(false) here,
            // as the /update-password page will handle its own loading state.
            // The session should already be set by Supabase client due to detectSessionInUrl.
            // Let's still map the session to ensure context is up-to-date if needed on this brief stop.
          }
          
          try {
            const { localSession, localUser } = mapSupabaseSessionToLocal(newSession, user, event);
            setSession(localSession);
            setUser(localUser);
          } catch (mapError) {
            console.error("AuthContext: Error mapping Supabase session:", mapError);
            setError(mapError instanceof Error ? mapError.message : 'Failed to process user session.');
            setSession(null);
            setUser(null);
          }

          if (!receivedInitialAuthEvent) {
            setIsLoading(false);
            receivedInitialAuthEvent = true;
            // Also attempt to clean hash on initial load if present (e.g. if user lands directly with hash)
            if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
              console.log('[AuthContext] Cleaning up URL hash on initial load.');
              history.replaceState({}, document.title, window.location.pathname + window.location.search);
            }
          }
        }
      );

      return () => {
        isMounted = false;
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Failed to initialize Supabase auth listener:", error);
      if (isMounted) {
        setError('Failed to initialize auth listener');
        setIsLoading(false);
      }
      return () => {};
    }
  }, [envError, router]);


  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginApi(credentials);
      if (!result.success || !result.session) {
         setError(result.error || 'Failed to login');
         setIsLoading(false);
         return result;
      }
      try {
          const supabaseSession = result.session as SupabaseSession; 
          const { localSession, localUser } = mapSupabaseSessionToLocal(supabaseSession, user, null);
          setSession(localSession);
          setUser(localUser);
          setIsLoading(false);
          return { ...result, user: localUser || undefined }; 
      } catch (mapError) {
          console.error("AuthContext: Error mapping Supabase session after login:", mapError);
          setError(mapError instanceof Error ? mapError.message : 'Failed to process user session after login.');
          setSession(null); 
          setUser(null);
          setIsLoading(false);
          return { success: false, error: mapError instanceof Error ? mapError.message : 'Mapping failed' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error("AuthContext Login error:", err);
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
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
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateProfileApi(profile);

      if (result.user) {
        setUser(result.user); // Optimistic update
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error("AuthContext Update profile error:", err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
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