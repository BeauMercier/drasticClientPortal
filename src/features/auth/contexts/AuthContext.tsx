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
} from '../api';
import { supabase } from '@/lib/api/client';
import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { validateEnv } from '@/lib/env';

function isValidUserRole(role: string | undefined | null): role is UserRole {
  if (!role) return false;
  return ['admin', 'designer', 'client', 'guest', 'partner'].includes(role);
}

const mapSupabaseSessionToLocal = (
  supabaseSession: SupabaseSession | null,
  currentUser: User | null,
  event: string | null
): { localSession: Session | null, localUser: User | null } => {
  if (!supabaseSession || !supabaseSession.user) {
    return { localSession: null, localUser: null };
  }

  const supabaseUser: SupabaseUser = supabaseSession.user;

  if (!supabaseUser.email) {
    throw new Error('Supabase user object missing email.');
  }

  let determinedUserRole: UserRole | undefined = undefined; 
  const appMetaRole = supabaseUser.app_metadata?.role as UserRole | undefined; 
  const userMetaRole = supabaseUser.user_metadata?.role as UserRole | undefined;

  if (appMetaRole && isValidUserRole(appMetaRole)) { 
    determinedUserRole = appMetaRole;
  } 
  else if (userMetaRole && isValidUserRole(userMetaRole)) {
    determinedUserRole = userMetaRole;
  }
  
  if (!determinedUserRole) {
    determinedUserRole = 'guest'; 
  }

  let resolvedAvatarUrl = supabaseUser.user_metadata?.avatar_url;
  if (currentUser && currentUser.avatar_url && event !== 'USER_UPDATED') {
    resolvedAvatarUrl = currentUser.avatar_url;
  }

  const localUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: determinedUserRole,
    full_name: supabaseUser.user_metadata?.full_name || '',
    avatar_url: resolvedAvatarUrl || '',
  };

  const localSession: Session = {
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
    expires_at: supabaseSession.expires_at || undefined,
    user: localUser,
  };

  return { localSession, localUser };
};

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

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const validateSessionOnLoad = async () => {
      // First, get the session from the browser
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // If no session exists locally, we can stop.
      if (!currentSession) {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      
      // A session exists, but it might be expired or invalid.
      // Verify it by fetching the user from the Supabase server.
      // This is a lightweight network request that confirms the token's validity.
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !supabaseUser) {
        // If there's an error or no user, the session is invalid.
        // Trigger a full logout to clear localStorage and redirect.
        await logout();
      } else {
        // The session is valid. Map the data to our local state.
        const { localSession, localUser } = mapSupabaseSessionToLocal(currentSession, null, 'SESSION_VALIDATED');
        setSession(localSession);
        setUser(localUser);
        setIsLoading(false);
      }
    };

    validateSessionOnLoad();

    // This listener remains crucial for handling real-time auth events
    // like signing in or out in another tab.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      try {
        const { localSession, localUser } = mapSupabaseSessionToLocal(newSession, user, _event);
        setSession(localSession);
        setUser(localUser);

        // If the user logs out from another tab, `newSession` will be null,
        // and we should make sure loading is complete.
        if (!newSession) {
            setIsLoading(false);
        }
      } catch (mapError) {
        console.error('[AuthContext] Error mapping session on state change:', mapError);
        setError(mapError instanceof Error ? mapError.message : 'Mapping session on change failed.');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginApi(credentials);
      if (!result.success || !result.session) {
         setError(result.error || 'Failed to login');
         return result;
      }
      const supabaseSession = result.session as SupabaseSession; 
      const { localSession, localUser } = mapSupabaseSessionToLocal(supabaseSession, null, 'SIGNED_IN');
      setSession(localSession);
      setUser(localUser);
      return { ...result, user: localUser || undefined }; 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await registerApi(data);
      if (result.user) {
        const supabaseSession = result.session as SupabaseSession;
        const { localSession, localUser } = mapSupabaseSessionToLocal(supabaseSession, null, 'SIGNED_IN');
        setSession(localSession);
        setUser(localUser);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await logoutApi();
      setSession(null);
      setUser(null);
      router.push('/');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await resetPasswordApi(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await updatePasswordApi(password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile: Partial<User>): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateProfileApi(profile);
      if (result.user) {
        setUser(prevUser => ({ ...prevUser, ...result.user } as User));
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

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

export const useAuthContext = () => useContext(AuthContext);