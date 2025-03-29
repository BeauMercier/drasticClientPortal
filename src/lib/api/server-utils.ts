/**
 * Supabase Server Utilities Module
 * 
 * This module provides server-ONLY Supabase client implementations.
 * It is designed to be used EXCLUSIVELY in API routes and server components.
 * DO NOT IMPORT THIS FILE IN CLIENT COMPONENTS.
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
// Remove unused import if createServerComponentClient is not used
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; 
import { createServerClient } from '@supabase/ssr';

/**
 * Retrieves Supabase URL, Anon Key, and Service Role Key from environment variables.
 * Intended for server-side use only. Includes console logging for debugging.
 * @returns {{ url: string | undefined; anonKey: string | undefined; serviceKey: string | undefined }}
 *          An object containing the Supabase configuration values.
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

// Note: createServerComponentSupabaseClient seems unused based on current imports/exports
// If needed, uncomment and document properly.
/*
export async function createServerComponentSupabaseClient() {
  // ... function body
}
*/

/**
 * Creates a Supabase client instance specifically for use within Next.js API Routes 
 * or Route Handlers. It reads/writes authentication cookies using the 'next/headers' `cookies()` store.
 * This client uses the Anon Key and respects RLS policies for the authenticated user.
 * 
 * **Important:** This function relies on `next/headers` and can ONLY be used in 
 * server-side contexts that support it (API Routes, Route Handlers, Server Components 
 * within the experimental PPR mode or specific Next.js versions).
 * @returns {SupabaseClient} A Supabase client instance configured for API Route cookie handling.
 * @throws {Error} If Supabase URL or Anon Key environment variables are missing.
 */
export function createApiClient(): SupabaseClient {
  const cookieStore = cookies();
  
  const { url, anonKey } = getServerSupabaseConfig();
  
  if (!url || !anonKey) {
    throw new Error('Missing Supabase URL or anonymous key for API client');
  }
  
  // Using createServerClient from @supabase/ssr for server-side cookie handling
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
             cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Errors can occur in read-only scenarios like server components
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
           try {
             cookieStore.set({ name, value: '', ...options });
           } catch (error) {
            // Errors can occur in read-only scenarios like server components
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Utility function to verify user authentication within API Routes or Route Handlers.
 * Uses `createApiClient` to get the user associated with the request's cookies.
 * 
 * **Important:** Requires `next/headers` context.
 * @returns {Promise<{ authenticated: boolean; user: User | null; error: string | null }>} 
 *          An object indicating authentication status, the user object if authenticated, or an error message.
 */
export async function requireAuth(): Promise<{ authenticated: boolean; user: User | null; error: string | null }> {
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