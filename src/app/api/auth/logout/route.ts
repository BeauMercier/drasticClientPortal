import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST handler for server-side logout
 * This ensures cookies are properly cleared
 */
export async function POST(request: NextRequest) {
  // Create a Supabase client
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Call sign out on the server to clear the session cookie
  await supabase.auth.signOut();

  // Set up response
  const response = NextResponse.json({ success: true });
  
  // Get all cookies
  const allCookies = cookieStore.getAll();
  
  // Explicitly expire all auth-related cookies
  allCookies.forEach(cookie => {
    if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
      response.cookies.set({
        name: cookie.name,
        value: '',
        expires: new Date(0), // Expire immediately
        path: '/',
      });
    }
  });

  return response;
} 