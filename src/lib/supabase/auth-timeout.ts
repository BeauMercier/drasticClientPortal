/**
 * Authentication Timeout Utilities
 * 
 * This module provides utilities for setting session timeouts for different user roles.
 * It works by setting cookies with appropriate expiry times.
 */

import { createBrowserClient } from '@supabase/ssr';
import { getEnv } from '@/lib/env';

// Get environment configuration
const env = getEnv();
const DEFAULT_SESSION_TIMEOUT = env.SESSION_TIMEOUT; // Default 8 hours
const ADMIN_SESSION_TIMEOUT = env.ADMIN_SESSION_TIMEOUT; // Default 2 hours

/**
 * Creates a Supabase client with the appropriate session timeout for the given role
 * @param role User role (admin or client)
 * @returns A Supabase client instance configured with the appropriate timeout
 */
export const getClientWithTimeout = (role?: string) => {
  const env = getEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Add checks for missing env vars before creating the client
  if (!supabaseUrl || !supabaseKey) {
    console.error('[auth-timeout.ts - getClientWithTimeout] Missing Supabase URL or Anon Key! Cannot create client with timeout.');
    // Optionally, return a dummy client or throw an error
    // For now, let's throw an error to make the issue explicit
    throw new Error('Missing Supabase URL or anonymous key for client with timeout.');
  }
  
  // Determine timeout based on role
  const sessionTimeout = role === 'admin' 
    ? ADMIN_SESSION_TIMEOUT 
    : DEFAULT_SESSION_TIMEOUT;

  // Return client with appropriate session timeout
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'  // Recommended for web apps
    },
    cookieOptions: {
      maxAge: sessionTimeout,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    },
    // Use singleton to prevent multiple client instances and rate limit issues
    isSingleton: true
  });
};

/**
 * Sets the appropriate cookie expiry time for a user session based on their role
 * @param accessToken The user's access token.
 * @param refreshToken The user's refresh token.
 * @param role The user's role (e.g., 'admin', 'client') to determine timeout.
 */
export const applySessionTimeout = async (accessToken: string, refreshToken: string, role: string) => {
  try {
    // Create a new client with the role-specific timeout
    const client = getClientWithTimeout(role);
    
    // Set the session with this client to apply the timeout
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    return true;
  } catch (error) {
    console.error('Failed to apply session timeout:', error);
    return false;
  }
};

/**
 * Updates SECURITY_RECOMMENDATIONS.md with the implemented timeout configuration
 */
export const sessionTimeoutInfo = {
  // The actual values being used
  defaultTimeout: `${DEFAULT_SESSION_TIMEOUT / 3600} hours (${DEFAULT_SESSION_TIMEOUT} seconds)`,
  adminTimeout: `${ADMIN_SESSION_TIMEOUT / 3600} hours (${ADMIN_SESSION_TIMEOUT} seconds)`,
  
  // Implementation details for documentation
  description: `Session timeouts are configured to enhance security:
  - Regular users: ${DEFAULT_SESSION_TIMEOUT / 3600} hours
  - Admin users: ${ADMIN_SESSION_TIMEOUT / 3600} hours (more restrictive for security)
  
  These timeouts are applied using Supabase cookie configuration, ensuring
  sessions expire appropriately based on the user's role.`
}; 