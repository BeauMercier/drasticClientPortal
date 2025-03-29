/**
 * Supabase Client Module
 * 
 * This module provides a standardized interface for interacting with Supabase.
 * It implements the singleton pattern to ensure only one client instance exists.
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

// Session timeout configuration based on environment variables
const env = getEnv();
/** Default session timeout duration (in seconds) for regular users. */
const DEFAULT_SESSION_TIMEOUT = env.SESSION_TIMEOUT; // Default 8 hours
/** Session timeout duration (in seconds) for admin users. */
const ADMIN_SESSION_TIMEOUT = env.ADMIN_SESSION_TIMEOUT; // Default 2 hours

// Client instance singletons
let browserClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

/**
 * Retrieves Supabase URL and Anon Key configuration for client-side usage.
 * Prioritizes environment variables, falling back to potential window object config.
 * IMPORTANT: Does NOT include the service role key.
 * @returns {{ url: string | undefined; anonKey: string | undefined }} Object containing URL and Anon Key.
 */
function getSupabaseConfig() {
  // Direct access to process.env
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // REMOVE serviceKey - Client should NEVER access this
  // let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // If missing, try from window.supabaseConfig (if used)
  if (typeof window !== 'undefined' && window.supabaseConfig) {
    if (!url && window.supabaseConfig.url) url = window.supabaseConfig.url;
    if (!anonKey && window.supabaseConfig.anonKey) anonKey = window.supabaseConfig.anonKey;
    // REMOVE serviceKey fallback
    // if (!serviceKey && window.supabaseConfig.serviceKey) serviceKey = window.supabaseConfig.serviceKey;
  }
  
  // Return only client-safe values
  return { url, anonKey };
}

/**
 * Creates a placeholder Supabase client that throws errors on usage.
 * Used as a fallback when client initialization fails, preventing hard crashes.
 * @returns {SupabaseClient} A dummy Supabase client instance.
 */
function createDummyClient(): SupabaseClient {
  const error = new Error('Supabase client not properly initialized');
  return {
    from: () => {
      throw error;
    },
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: { message: 'Dummy client used' },
      }),
      signOut: async () => ({
        error: { message: 'Dummy client used' },
      }),
    },
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: { message: 'Dummy client used' },
        }),
        download: async () => ({
          data: null,
          error: { message: 'Dummy client used' },
        }),
        list: async () => ({
          data: null,
          error: { message: 'Dummy client used' },
        }),
        remove: async () => ({
          data: null,
          error: { message: 'Dummy client used' },
        }),
      }),
    },
  } as unknown as SupabaseClient;
}

/**
 * Creates or retrieves a singleton Supabase client instance for browser/client-side use.
 * Uses the default session timeout.
 * @returns {SupabaseClient} The client-side Supabase client instance.
 */
export const createClient = (): SupabaseClient => {
  // Return existing instance if available
  if (browserClientInstance) {
    return browserClientInstance;
  }
  
  try {
    const { url, anonKey } = getSupabaseConfig();
    
    if (!url || !anonKey) {
      console.error('Missing Supabase URL or anonymous key. Client creation will fail.');
      return createDummyClient();
    }

    // Create and store new client instance
    browserClientInstance = createBrowserClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'  // Recommended for web apps
      },
      // Configure cookie options for session timeout
      cookieOptions: {
        maxAge: DEFAULT_SESSION_TIMEOUT,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    });
    
    return browserClientInstance;
  } catch (e) {
    console.error('Error creating Supabase client:', e);
    return createDummyClient();
  }
};

/**
 * Creates or retrieves a singleton Supabase client instance for browser/client-side use,
 * configured with the admin session timeout.
 * Note: This is still a client-side client using the anon key, NOT the service role key.
 * It's intended for scenarios where admin users might have shorter session durations in the UI.
 * @returns {SupabaseClient} The client-side Supabase client instance configured for admin timeout.
 */
export const createAdminClient = (): SupabaseClient => {
  // Return existing instance if available
  if (adminClientInstance) {
    return adminClientInstance;
  }
  
  try {
    const { url, anonKey } = getSupabaseConfig();
    
    if (!url || !anonKey) {
      console.error('Missing Supabase URL or anonymous key. Admin client creation will fail.');
      return createDummyClient();
    }

    // Create and store new client instance
    adminClientInstance = createBrowserClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'  // Recommended for web apps
      },
      // Configure cookie options for admin session timeout
      cookieOptions: {
        maxAge: ADMIN_SESSION_TIMEOUT,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    });
    
    return adminClientInstance;
  } catch (e) {
    console.error('Error creating admin Supabase client:', e);
    return createDummyClient();
  }
};

/**
 * Tests the connection to Supabase by attempting to get the session and perform a simple query.
 * Checks for URL/Key configuration errors, authentication errors, and database query errors.
 * @returns {Promise<{ success: boolean; error?: string; message?: string; missing?: object; details?: any; authenticated?: boolean }>} 
 *          An object indicating connection status, potential errors, and authentication state.
 */
export const testSupabaseConnection = async () => {
  try {
    const { url, anonKey } = getSupabaseConfig();
    
    if (!url || !anonKey) {
      return { 
        success: false, 
        error: 'Missing Supabase URL or anonymous key',
        missing: {
          url: !url,
          anonKey: !anonKey
        }
      };
    }
    
    const client = createClient();
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      return { 
        success: false, 
        error: `Authentication error: ${error.message}` 
      };
    }
    
    // Try to make a simple query to verify database access
    const { error: queryError } = await client
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (queryError) {
      return { 
        success: false, 
        error: `Database query error: ${queryError.message}`,
        details: queryError 
      };
    }
    
    return { 
      success: true, 
      message: 'Supabase connection successful',
      authenticated: !!data.session 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error 
    };
  }
};

/**
 * Default client-side Supabase client instance (singleton).
 * Uses the default session timeout.
 */
const supabase = createClient();
export default supabase; 