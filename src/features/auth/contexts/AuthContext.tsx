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

  useEffect(() => {
    if (envError) {
      console.error('Skipping auth initialization due to environment error');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initializeSession = async () => {
      // 1. Get the initial session from cookies/localStorage
      const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();

      if (initialError) {
        console.error('[AuthContext] Error fetching initial session:', initialError.message);
      }

      // Set initial state based on the fetched session
      if (isMounted) {
        if (initialSession) {
          try {
            const { localSession, localUser } = mapSupabaseSessionToLocal(initialSession, null, 'INITIAL_SESSION');
            setSession(localSession);
            setUser(localUser);
          } catch (mapError) {
            console.error('[AuthContext] Error mapping initial session:', mapError);
            setError(mapError instanceof Error ? mapError.message : 'Mapping session failed.');
          }
        }
        setIsLoading(false);
      }

      // 2. Set up the listener for subsequent auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (!isMounted) return;

          console.log(`[AuthContext] onAuthStateChange event: ${event}`);
          
          if (event === 'PASSWORD_RECOVERY') {
            router.replace('/update-password');
            return;
          }
          
          try {
            const { localSession, localUser } = mapSupabaseSessionToLocal(newSession, user, event);
            setSession(localSession);
            setUser(localUser);
          } catch (mapError) {
            console.error('[AuthContext] Error mapping session on state change:', mapError);
            setError(mapError instanceof Error ? mapError.message : 'Mapping session on change failed.');
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    const unsubscribePromise = initializeSession();

    return () => {
      isMounted = false;
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, [envError, router]);


  // Re-validate session on window focus
  useEffect(() => {
    const handleFocus = async () => {
      if (supabase) {
        await supabase.auth.getSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


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