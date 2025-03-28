/**
 * Supabase Client Service
 * 
 * Re-exports the main Supabase client instance and types from the lib implementation
 * to maintain compatibility with components using shared/services/supabase.
 */

// Import types from Supabase directly with explicit type imports
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';

// Re-export the types
export type { User, Session, SupabaseClient };

// Export the Supabase client functions
export {
  createClient,
  createServiceRoleClient,
  testSupabaseConnection
} from '@/lib/api/client'; // Updated to use the new API path

// Export default supabase instance from the index
export { supabase } from '@/lib/api'; 