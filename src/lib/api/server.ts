/**
 * Supabase Server Client Module
 * 
 * This module provides server-specific Supabase client implementations.
 * It should ONLY be imported in server components, API routes, or other server-only contexts.
 * 
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server client singletons
let serviceRoleClientInstance: SupabaseClient | null = null;

/**
 * Retrieves Supabase URL, Anon Key, and Service Role Key from environment variables.
 * Intended for server-side use only.
 * @returns {{ url: string | undefined; anonKey: string | undefined; serviceKey: string | undefined }}
 *          An object containing the Supabase configuration values.
 */
function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return { url, anonKey, serviceKey };
}

/**
 * Creates or retrieves a singleton Supabase client instance configured with the Service Role Key.
 * This client bypasses Row Level Security (RLS) and should be used with extreme caution
 * in server-side code only (e.g., for administrative tasks, database migrations).
 * 
 * **Warning:** Never expose this client or its key to the browser.
 * @returns {SupabaseClient} The service role Supabase client instance.
 * @throws {Error} If Supabase URL or Service Role Key environment variables are missing.
 */
export function createServiceRoleClient(): SupabaseClient {
  // Return existing instance if available
  if (serviceRoleClientInstance) {
    return serviceRoleClientInstance;
  }
  
  const { url, serviceKey } = getServerSupabaseConfig();
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase URL or service role key for server client');
  }
  
  // Create and store new client instance
  serviceRoleClientInstance = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    }
  });
  
  if (!serviceRoleClientInstance) {
    throw new Error('Failed to create service role client');
  }
  
  return serviceRoleClientInstance;
}

/**
 * Creates a Supabase client instance configured with the Service Role Key, specifically intended
 * for administrative operations that need to bypass RLS but should still be identifiable
 * (e.g., via custom headers for logging or triggers).
 * Does not use singleton pattern; creates a new instance each time.
 * 
 * **Warning:** Use with caution in server-side code only.
 * @returns {SupabaseClient} An admin Supabase client instance (using service role key).
 * @throws {Error} If Supabase URL or Service Role Key environment variables are missing.
 */
export function createAdminClient(): SupabaseClient {
  const { url, serviceKey } = getServerSupabaseConfig();
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase URL or service role key for admin client');
  }
  
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        'x-admin-operation': 'true'
      }
    }
  });
} 