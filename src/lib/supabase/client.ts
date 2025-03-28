/**
 * @deprecated This file is deprecated and will be removed in a future update.
 * Please use the new API client from @/lib/api/client.ts instead.
 * 
 * The ApiClient class provides a more consistent interface with better error handling
 * and standardized response formats.
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

// Session timeout configuration based on environment variables
const env = getEnv();
const DEFAULT_SESSION_TIMEOUT = env.SESSION_TIMEOUT; // Default 8 hours
const ADMIN_SESSION_TIMEOUT = env.ADMIN_SESSION_TIMEOUT; // Default 2 hours

// Get Supabase config values with fallbacks - FIXED VERSION
function getSupabaseConfig() {
  // Direct access to process.env instead of going through getEnv()
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Debug what values we're getting
  console.log('Supabase config from process.env:', { 
    url: url ? 'set' : 'missing', 
    anonKey: anonKey ? 'set' : 'missing',
    serviceKey: serviceKey ? 'set' : 'missing' 
  });
  
  // If missing, try from window.supabaseConfig
  if (typeof window !== 'undefined' && window.supabaseConfig) {
    if (!url && window.supabaseConfig.url) url = window.supabaseConfig.url;
    if (!anonKey && window.supabaseConfig.anonKey) anonKey = window.supabaseConfig.anonKey;
    if (!serviceKey && window.supabaseConfig.serviceKey) serviceKey = window.supabaseConfig.serviceKey;
  }
  
  return { url, anonKey, serviceKey };
}

// Temporary dummy client for type checking
function createDummyClient() {
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
  };
}

// Create a Supabase client for use in client components
// Using the default timeout
export const createClient = () => {
  try {
    // First try using the getSupabaseConfig function
    const { url, anonKey } = getSupabaseConfig();
    
    // If values from getSupabaseConfig are missing, try direct access to process.env as fallback
    const finalUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const finalAnonKey = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Log the final config values
    console.log('Supabase client config:', {
      url: finalUrl ? 'set' : 'missing',
      anonKey: finalAnonKey ? 'set' : 'missing'
    });
    
    if (!finalUrl || !finalAnonKey) {
      console.error('Missing Supabase URL or anonymous key. Client creation will fail.');
      console.log('Attempted values:', { url: finalUrl ? 'exists' : 'missing', anonKey: finalAnonKey ? 'exists' : 'missing' });
      return createDummyClient();
    }

    return createBrowserClient(finalUrl, finalAnonKey, {
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
      },
      // Use a singleton client to prevent multiple instances
      isSingleton: true
    });
  } catch (e) {
    console.error('Error creating Supabase client:', e);
    return createDummyClient();
  }
};

// Create a Supabase client with admin timeout
export const createAdminClient = () => {
  try {
    const { url, anonKey } = getSupabaseConfig();
    
    if (!url || !anonKey) {
      console.error('Missing Supabase URL or anonymous key. Admin client creation will fail.');
      return createDummyClient();
    }

    return createBrowserClient(url, anonKey, {
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
      },
      // Use a singleton client to prevent multiple instances
      isSingleton: true
    });
  } catch (e) {
    console.error('Error creating admin Supabase client:', e);
    return createDummyClient();
  }
};

// Export the supabase client instance using default timeout
export const supabase = createClient();

// Test Supabase connection and return status
export const testSupabaseConnection = async () => {
  try {
    // First try using the getSupabaseConfig function
    const { url, anonKey } = getSupabaseConfig();
    
    // If values from getSupabaseConfig are missing, try direct access to process.env as fallback
    const finalUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const finalAnonKey = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Log the final test config values
    console.log('Supabase connection test config:', {
      url: finalUrl ? 'set' : 'missing',
      anonKey: finalAnonKey ? 'set' : 'missing'
    });
    
    if (!finalUrl || !finalAnonKey) {
      return { 
        success: false, 
        error: 'Missing Supabase URL or anonymous key',
        missing: {
          url: !finalUrl,
          anonKey: !finalAnonKey
        }
      };
    }
    
    const client = createBrowserClient(finalUrl, finalAnonKey, {
      // Use a singleton client to prevent multiple instances
      isSingleton: true
    });
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

// Create a Supabase service role client that bypasses RLS policies for server-side use
export const createServiceRoleClient = () => {
  // This should only be used in server components or API routes
  if (typeof window !== 'undefined') {
    console.error('Service role client cannot be used in browser environment');
    return createDummyClient();
  }
  
  try {
    const { url, serviceKey } = getSupabaseConfig();
    
    if (!url || !serviceKey) {
      console.error('Missing Supabase URL or service role key. Service client creation will fail.');
      return createDummyClient();
    }
    
    return createServerClient(url, serviceKey, {
      auth: {
        persistSession: false,
      }
    });
  } catch (error) {
    console.error('Error creating service role client:', error);
    return createDummyClient();
  }
}; 