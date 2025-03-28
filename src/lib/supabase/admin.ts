import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Define a type that includes our custom property
type AdminSupabaseClient = SupabaseClient & {
  _supabaseKey?: string;
};

// Singleton pattern for admin client
let adminSupabaseClient: AdminSupabaseClient | null = null;

/**
 * Gets the admin Supabase client using the service role key
 * Only use this in server-side contexts (API routes, etc.)
 * Never expose the service key client-side
 */
export function getAdminClient() {
  // Environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase URL or service role key. Check your environment variables.');
  }
  
  // Reset if key changes (unlikely, but handled for completeness)
  if (adminSupabaseClient && adminSupabaseClient._supabaseKey !== serviceKey) {
    adminSupabaseClient = null;
  }
  
  if (!adminSupabaseClient) {
    adminSupabaseClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }) as AdminSupabaseClient;
    
    adminSupabaseClient._supabaseKey = serviceKey;
  }
  
  return adminSupabaseClient;
} 