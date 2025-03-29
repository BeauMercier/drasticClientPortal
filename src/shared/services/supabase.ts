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
  testSupabaseConnection
} from '@/lib/api/client'; // Updated to use the new API path

// DO NOT re-export the server-only function from the shared barrel file.
// Server-side code should import it directly from @/lib/supabase/server
// export { createServiceRoleClient } from '@/lib/supabase/server';

// Export default supabase instance from the index
export { supabase } from '@/lib/api'; 