import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🔌  Legacy factory kept for backwards compatibility.
 *      All old code that did  `const supa = createClient()` keeps working.
 *      New code should import { supabase } directly.
 */
export function createClient() {
  return supabase;
}

/* Optional: default export for code you missed */
export default supabase;
