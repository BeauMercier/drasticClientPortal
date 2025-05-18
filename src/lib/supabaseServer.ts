import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/api/server'; // Adjusted path based on search results

/**
 * Provides a server-side Supabase client instance using the service role key.
 * This client bypasses Row Level Security (RLS) and should be used with caution.
 * It's intended for use in API routes where administrative operations are performed
 * after appropriate authentication and authorization checks.
 */
export function supabaseServer(): SupabaseClient {
  return createServiceRoleClient();
} 