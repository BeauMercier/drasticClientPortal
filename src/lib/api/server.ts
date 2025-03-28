/**
 * Supabase Server Client Module
 * 
 * This module provides server-specific Supabase client implementations
 * that are safe to import in both client and server components.
 * 
 * For server-component only functionality, use server-utils.ts instead.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server client singletons
let serviceRoleClientInstance: SupabaseClient | null = null;

/**
 * Get Supabase config values for server-side use
 */
function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return { url, anonKey, serviceKey };
}

/**
 * Create a Supabase service role client that bypasses RLS policies
 * @returns A Supabase client with service role credentials
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
 * Create a Supabase admin client for privileged API operations
 * These operations will bypass RLS policies but maintain an audit trail
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

// Export default service role client for convenience
export default createServiceRoleClient(); 