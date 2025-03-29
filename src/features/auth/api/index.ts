/**
 * Auth API Module
 * 
 * Contains all API functions related to authentication and user management
 */

import { 
  LoginCredentials, 
  RegisterData, 
  ResetPasswordRequest,
  User,
  AuthResult
} from '../types';

// Import Supabase client from the lib module
import supabase from '@/lib/api/client';
// Import Supabase Session type
import type { Session as SupabaseSession } from '@supabase/supabase-js';

// Import session timeout utilities
import { applySessionTimeout } from '../../../lib/supabase/auth-timeout';
import { getEnv } from '@/lib/env';

// Simple cache for session data to prevent excessive API calls
interface SessionCache {
  session: SupabaseSession | null;
  timestamp: number;
  expiresAt: number;
}

let sessionCache: SessionCache | null = null;
const CACHE_TTL = 60000; // Cache session for 1 minute

/**
 * Login user with email and password
 */
export async function login(
  credentials: LoginCredentials, 
  onSuccess?: (session: SupabaseSession, user: User) => void
): Promise<AuthResult> {
  try {
    // Use the default client for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'User data not available'
      };
    }

    // Extract role from user metadata
    const role = data.user.user_metadata?.role || 'client';

    // Apply role-specific session timeout
    await applySessionTimeout(
      data.session.access_token,
      data.session.refresh_token,
      role
    );

    // Update the session cache
    sessionCache = {
      session: data.session,
      timestamp: Date.now(),
      expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + (24 * 60 * 60 * 1000)
    };

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      role,
      full_name: data.user.user_metadata?.full_name,
      avatar_url: data.user.user_metadata?.avatar_url,
      metadata: data.user.user_metadata
    };

    // Immediately update auth state if callback provided
    if (onSuccess && data.session) {
      onSuccess(data.session, user);
    }

    return {
      success: true,
      user,
      session: data.session
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  try {
    // Use the default client for registration
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          company: data.company,
          role: 'client' // Default role for new users
        }
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'User registration failed'
      };
    }

    const user: User = {
      id: authData.user.id,
      email: authData.user.email || '',
      role: 'client',
      full_name: data.full_name,
      metadata: authData.user.user_metadata
    };

    return {
      success: true,
      user,
      message: 'Registration successful. Please check your email to confirm your account.'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<AuthResult> {
  try {
    // Perform signOut which should clear the session server-side
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during logout'
      };
    }

    // Clear the session cache
    sessionCache = null;

    // Additional client-side cleanup to ensure complete logout
    // Clear any Supabase-related items from localStorage
    if (typeof window !== 'undefined') {
      try {
        // Get all keys from localStorage
        const localStorageKeys = Object.keys(localStorage);
        
        // Filter for Supabase-related keys
        const supabaseKeys = localStorageKeys.filter(key => 
          key.includes('supabase') || key.includes('sb-')
        );
        
        // Remove all Supabase-related items
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        console.log(`Cleared ${supabaseKeys.length} Supabase-related items from localStorage`);
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }

    // Force refresh cookies using a direct fetch to the auth endpoint
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Error calling logout endpoint:', e);
    }

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during logout'
    };
  }
}

/**
 * Request password reset for user
 */
export async function resetPassword(request: ResetPasswordRequest): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email'
      };
    }

    return {
      success: true,
      message: 'Password reset instructions sent to your email'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email'
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'User data not available'
      };
    }

    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password'
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(profile: Partial<User>): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url
      }
    });

    if (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'User data not available'
      };
    }

    // Update the profiles table with additional profile information
    // This is separate from the auth.users table managed by Supabase Auth
    if (profile.role || profile.metadata) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
          ...profile 
        })
        .eq('id', data.user.id);

      if (profileError) {
        return {
          success: false,
          error: profileError.message
        };
      }
    }

    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    // Check cache first to avoid unnecessary API calls
    const now = Date.now();
    
    if (sessionCache && 
        sessionCache.timestamp + CACHE_TTL > now && 
        sessionCache.expiresAt > now) {
      return {
        success: true,
        session: sessionCache.session
      };
    }
    
    // If no valid cache, make the API call
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      // Clear cache on error
      sessionCache = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown session error'
      };
    }
    
    // Update cache with fresh data
    if (data.session) {
      sessionCache = {
        session: data.session,
        timestamp: now,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : now + (24 * 60 * 60 * 1000)
      };
    } else {
      // No session = logged out
      sessionCache = null;
    }
    
    return {
      success: true,
      session: data.session
    };
  } catch (error) {
    console.error('Get session error:', error);
    // Clear cache on error
    sessionCache = null;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown session error'
    };
  }
} 