/**
 * Supabase Server Utilities Module
 * 
 * This module provides server-ONLY Supabase client implementations.
 * It is designed to be used EXCLUSIVELY in API routes and server components.
 * DO NOT IMPORT THIS FILE IN CLIENT COMPONENTS.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';

/**
 * Get Supabase config values for server-side use
 */
function getServerSupabaseConfig() {
  console.log('[api/server-utils.ts - getServerSupabaseConfig] Reading env vars:', {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'found' : 'undefined',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'found' : 'undefined',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'found' : 'undefined',
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return { url, anonKey, serviceKey };
}

/**
 * Create a Supabase client for server components with cookie support
 * This client respects RLS policies but has access to the current user's session
 */
export async function createServerComponentSupabaseClient() {
  const cookieStore = cookies();
  
  const { url, anonKey } = getServerSupabaseConfig();
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anonymous key for server component client');
  }
  
  return createServerComponentClient({ cookies: () => cookieStore }, {
    supabaseUrl: url,
    supabaseKey: anonKey
  });
}

/**
 * Create a Supabase client for API routes with cookie support
 */
export function createApiClient() {
  const cookieStore = cookies();
  
  const { url, anonKey } = getServerSupabaseConfig();
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anonymous key for API client');
  }
  
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // In Next.js Edge Runtime, we can't set cookies here
          // This is handled by the middleware
        },
        remove(name, options) {
          // In Next.js Edge Runtime, we can't remove cookies here
          // This is handled by the middleware
        },
      },
    }
  );
}

/**
 * Function to force authentication in API routes
 */
export async function requireAuth() {
  console.log('[api/server-utils.ts - requireAuth] Attempting to authenticate API request...');
  const supabase = createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.warn('[api/server-utils.ts - requireAuth] Authentication FAILED:', { error: error?.message, userExists: !!user });
    return { 
      authenticated: false, 
      user: null, 
      error: error?.message || 'Authentication required' 
    };
  }
  
  console.log(`[api/server-utils.ts - requireAuth] Authentication SUCCESSFUL for user: ${user.id}`);
  return { 
    authenticated: true, 
    user: user,
    error: null
  };
} 