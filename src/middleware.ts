import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
// getUserRole is not used in the provided snippet for middleware, comment out or remove if not used elsewhere in the actual file after changes.
// import { getUserRole } from './lib/utils/user'; 

// Original env var logging can remain if desired, or be removed.
console.log('[middleware.ts] Checking environment variables at middleware start:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'found' : 'undefined',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'found' : 'undefined',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'found' : 'undefined',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Early return for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') || // Assuming /images contains static assets
    pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js)$/)
  ) {
    return response; // NextResponse.next() is sufficient, no cookie operations needed
  }

  // Define public paths that do not require authentication checks or Supabase client init for auth
  const publicPaths = ['/login', '/register', '/reset-password', '/']; // Add other public paths like /about, /contact, etc.
  // Note: The root '/' is often public, leading to a dashboard if logged in, or a landing page if not.
  // If root path itself requires knowing auth state for conditional rendering by middleware, keep it out of here.
  const isPublicPath = publicPaths.includes(pathname);

  // 2. For specific public paths that don't need any auth interaction from middleware, return early.
  // For example, if '/' is a public landing page and doesn't need role-based redirects from middleware.
  // This check is more about skipping Supabase client init for purely public, non-auth-sensitive pages.
  // The more comprehensive auth check follows if not returned here.
  if (isPublicPath && pathname === '/') { // Example: only root path if it's purely public
     // If you have other specific public paths that should *never* interact with auth cookies, add them here.
     // return response;
  } 
  // At this point, we are dealing with paths that might need auth or cookie operations.

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            domain: '.drasticdigital.com', // Force parent domain
            path: '/',
            ...options, // Spread original options like maxAge, httpOnly, secure
            // Ensure secure and httpOnly are appropriately set, usually from original options or defaults
            secure: process.env.NODE_ENV === 'production', // Or always true if site is HTTPS only
            httpOnly: true, // Usually true for auth tokens
            sameSite: 'lax', // Good default
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            domain: '.drasticdigital.com', // Force parent domain
            path: '/',
            expires: new Date(0), // Expire the cookie
            // Spread other options if necessary, though domain/path/expires are key for removal
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } /*, error: userError // userError logging can be re-enabled if needed */ } = await supabase.auth.getUser();
  // Removed UserError logging and pre/post getUser logs as per cleanup.

  // Original console.log for path and user can be kept for general visibility if desired, or removed.
  console.log(`Middleware check - Path: ${pathname}, User: ${user ? user.id : 'null'}`);

  // API routes are already handled by the early return for static assets if /api/ is like /_next/api
  // If your API routes are different, ensure they are handled appropriately (e.g. isApiRoute check if not covered by early returns)

  const roleBasePaths: { [key: string]: string } = {
    admin: '/admin',
    designer: '/designer',
    client: '/client',
    partner: '/partner',
  };
  const authenticatedPathsPrefixes = [...Object.values(roleBasePaths)]; 
  // Removed '/dashboard' as it's usually a role-specific path like /client/dashboard or /admin/dashboard

  const requiresAuth = authenticatedPathsPrefixes.some(prefix => pathname.startsWith(prefix));

  if (!user) {
    if (requiresAuth) {
      console.log(`Redirecting to login: No user and accessing protected route ${pathname}`);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  if (user) {
    let userRole = 'client';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      userRole = profile?.role?.toLowerCase() || 'client';
      if (!roleBasePaths[userRole]) {
        console.warn(`User ${user.id} has invalid role '${profile?.role}'. Defaulting to client.`);
        userRole = 'client';
      }
    } catch (roleError) {
      console.error(`Failed to fetch role for user ${user.id}:`, roleError);
    }

    const expectedBasePath = roleBasePaths[userRole];
    const isPublicAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/reset-password');

    if (isPublicAuthRoute) { // Simplified: /dashboard was removed from here
      console.log(`Redirecting logged-in user (${userRole}) from ${pathname} to ${expectedBasePath}`);
      return NextResponse.redirect(new URL(expectedBasePath, request.url));
    }

    if (requiresAuth) {
      if (!pathname.startsWith(expectedBasePath)) {
        console.log(`Role mismatch: User role '${userRole}' attempting to access ${pathname}. Redirecting to ${expectedBasePath}.`);
        return NextResponse.redirect(new URL(expectedBasePath, request.url));
      }
    }
    // Optional: Root path redirect for logged-in user can be re-enabled here if needed
    // if (pathname === '/') { ... }
  }
  return response;
}

export const config = {
  matcher: [
    '/(.*)',
  ],
}; 