import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Centralized function to create a Supabase client for API routes
export function createSupabaseClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // In Next.js Edge Runtime, we can't set cookies here
          // This is handled by the middleware
        },
        remove(_name: string, _options: CookieOptions) {
          // In Next.js Edge Runtime, we can't remove cookies here
          // This is handled by the middleware
        },
      },
    }
  );
}

// Function to force authentication in API routes
export async function requireAuth() {
  const supabase = createSupabaseClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { 
      authenticated: false, 
      user: null, 
      error: error?.message || 'Authentication required' 
    };
  }
  
  return { 
    authenticated: true, 
    user: user,
    error: null
  };
}

// Function to get current session for browser
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} 