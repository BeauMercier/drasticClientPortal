/**
 * Supabase Server Client Module
 * 
 * This module provides utilities for creating Supabase clients specifically for server-side use.
 * It should only be imported in server components, API routes, or other server-only contexts.
 */

import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for the service role client on the server
let serviceRoleClientInstance: SupabaseClient | null = null;

/**
 * Temporary dummy client for type checking and fallback in case of server-side errors
 */
function createDummyServerClient(): SupabaseClient {
  const error = new Error('Supabase service role client not properly initialized on server');
  // Return a basic object conforming to SupabaseClient for type safety, 
  // but operations will throw the error.
  return {
    from: () => { throw error; },
    auth: { /* Implement dummy methods if needed, throwing errors */ },
    storage: { /* Implement dummy methods if needed, throwing errors */ },
    // Add other necessary top-level properties or methods expected by SupabaseClient type
  } as unknown as SupabaseClient;
}

/**
 * Create a Supabase service role client that bypasses RLS policies.
 * This MUST only be used in server-side code (Server Components, API routes, etc.).
 * Implements singleton pattern for server instance.
 */
export const createServiceRoleClient = (): SupabaseClient => {
  // Return existing instance if available (for the current server instance)
  if (serviceRoleClientInstance) {
    return serviceRoleClientInstance;
  }

  // Ensure this isn't accidentally called client-side (shouldn't happen if imports are correct)
  if (typeof window !== 'undefined') {
    console.error('FATAL: createServiceRoleClient called in browser environment!');
    throw new Error('Attempted to create service role client in browser.');
  }

  try {
    // Direct access to process.env is required server-side
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error('Missing Supabase URL or service role key. Cannot create service client.');
      // Decide: throw error immediately or return dummy? Throwing is safer server-side.
      throw new Error('Missing Supabase URL or service role key for server client');
    }

    // Create and store new client instance
    serviceRoleClientInstance = supabaseCreateClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    return serviceRoleClientInstance;

  } catch (error) {
    console.error('Error creating Supabase service role client:', error);
    // Return a dummy client or re-throw, depending on desired server behavior on failure
    // Throwing might be better to prevent unexpected behavior
    throw error; // Re-throw the error after logging
  }
}; 