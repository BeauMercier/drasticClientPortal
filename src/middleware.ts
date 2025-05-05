import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getUserRole } from './lib/utils/user';

// Log environment variables available in the middleware
console.log('[middleware.ts] Checking environment variables at middleware start:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'found' : 'undefined',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'found' : 'undefined',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'found' : 'undefined',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV, // Vercel specific env
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Create initial response - allows cookies to be set later
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Create Supabase client linked to request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Cookie is set/updated, modify the response
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Cookie is removed, modify the response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. Get AUTHENTICATED user data (verifies with Supabase server)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    // Log the error but allow proceeding, as getUser might fail for network reasons
    // Access control later in the middleware will handle the !user case
    console.warn(`getUser error in middleware (${pathname}):`, userError.message);
  }
  // User object is now either the authenticated user or null

  console.log(`Middleware check - Path: ${pathname}, User: ${user ? user.id : 'null'}`);

  // --- Route Handling --- 
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|css|js|ico)$/) || pathname.startsWith('/images/') || pathname.startsWith('/_next/');
  const isPublicAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');
  const isRoot = pathname === '/';

  // Allow static assets and API routes generally
  if (isApiRoute || isStaticAsset) {
    return response; 
  }

  // --- NEW Redirect & Authorization Logic ---

  // Define role-specific base paths
  const roleBasePaths: { [key: string]: string } = {
    admin: '/admin',
    designer: '/designer',
    client: '/client',
    partner: '/partner', // Add other roles as needed
  };

  // Define paths that require authentication
  const authenticatedPathsPrefixes = [...Object.values(roleBasePaths), '/dashboard'];
  const requiresAuth = authenticatedPathsPrefixes.some(prefix => pathname.startsWith(prefix) || pathname === prefix);

  // === Handle Unauthenticated Users ===
  if (!user) {
    if (requiresAuth) {
      console.log(`Redirecting to login: No user and accessing protected route ${pathname}`);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Allow unauthenticated access to non-protected routes (like /, /login, etc.)
    return response;
  }

  // === Handle Authenticated Users ===
  if (user) {
    // Fetch user role (ensure getUserRole works correctly)
    let userRole = 'client'; // Default role if fetch fails or is missing
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      // Use the utility function or directly use profile role, ensure it's lowercase
      userRole = profile?.role?.toLowerCase() || 'client'; 
      // Validate role if needed
      if (!roleBasePaths[userRole]) {
        console.warn(`User ${user.id} has invalid role '${profile?.role}'. Defaulting to client.`);
        userRole = 'client';
      }
    } catch (roleError) {
      console.error(`Failed to fetch role for user ${user.id}:`, roleError);
      // Keep default role 'client'
    }

    const expectedBasePath = roleBasePaths[userRole];

    // 1. Redirect logged-in users away from public auth pages OR old /dashboard
    if (isPublicAuthRoute || pathname === '/dashboard') {
      console.log(`Redirecting logged-in user (${userRole}) from ${pathname} to ${expectedBasePath}`);
      return NextResponse.redirect(new URL(expectedBasePath, request.url));
    }

    // 2. Enforce role access for protected paths (excluding /dashboard, already handled)
    if (requiresAuth && pathname !== '/dashboard') {
      // If user is trying to access a protected path that IS NOT their own
      if (!pathname.startsWith(expectedBasePath)) {
        console.log(`Role mismatch: User role '${userRole}' attempting to access ${pathname}. Redirecting to ${expectedBasePath}.`);
        return NextResponse.redirect(new URL(expectedBasePath, request.url));
      }
      // Allow access if path starts with expectedBasePath
      return response;
    }

    // 3. Handle root path (/) for logged-in users (Optional: redirect or let page handle)
    // If you want middleware to redirect from root immediately:
    /*
    if (isRoot) {
      console.log(`Redirecting logged-in user (${userRole}) from / to ${expectedBasePath}`);
      return NextResponse.redirect(new URL(expectedBasePath, request.url));
    }
    */
    // Otherwise, allow access to root (homepage logic will likely redirect anyway)
  }

  // Default case: Allow access if none of the above conditions caused a redirect
  return response;
}

// Keep matcher config
export const config = {
  matcher: [
    // Include all paths, including API routes
    '/(.*)',
  ],
}; 