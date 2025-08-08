import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
// getUserRole is not used in the provided snippet for middleware, comment out or remove if not used elsewhere in the actual file after changes.
// import { getUserRole } from './lib/utils/user'; 
import { roleBasePaths } from '@/lib/config/auth-config'; // Added import
import { UserRole } from '@/features/auth/types'; // Import UserRole

// Helper function to check if a string is a valid UserRole
function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'designer', 'client', 'guest', 'partner'].includes(role);
}

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
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // DEV: allow experimental v2 pages without legacy client layout/auth
  if (
    pathname.startsWith('/client/my-profile-v2') ||
    pathname.startsWith('/client/projects/web-design-v2')
  ) {
    return response;
  }

  // 1. Early return for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js)$/)
  ) {
    return response;
  }

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
            ...options,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            expires: new Date(0),
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  console.log(`Middleware check - Path: ${pathname}, User: ${user ? user.id : 'null'}, Role from JWT: ${user?.app_metadata?.role}`);

  // Handle root path redirects for authenticated, non-guest users
  if (pathname === '/' && user) {
    const userRole = (user.app_metadata?.role as UserRole) || 'guest'; // Default to guest if role not in JWT
    // Only redirect if the user is not a guest and has a defined dashboard path
    if (userRole !== 'guest' && roleBasePaths[userRole] && roleBasePaths[userRole] !== '/') {
      const dash = roleBasePaths[userRole];
      console.log(`Authenticated user (${userRole}) on root path. Redirecting to ${dash}.`);
      return NextResponse.redirect(new URL(dash, request.url));
    }
    // If guest or no specific dashboard path from root, let them see the homepage
    console.log(`User (${userRole}) on root path. Allowing homepage to render.`);
    // No redirect, proceed to other rules or allow response for homepage
  }

  /* ─── PUBLIC AUTH PAGES ─── */
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset-password');

  if (isAuthPage) {
    if (!user) {
      console.log(`No user session on auth page ${pathname}. Allowing page to render.`);
      return response; 
    }

    // User is logged in, get role from JWT
    const userRole = (user.app_metadata?.role as UserRole) || 'client'; 
    const dash = roleBasePaths[userRole] || roleBasePaths['client']; 

    // If their designated dashboard IS the current auth page (e.g., guest on /login), let them stay.
    if (dash === pathname) {
      console.log(`User (${userRole}) is on their designated auth page ${pathname}. Allowing page to render.`);
      return response; 
    }
    
    console.log(`Logged-in user (${userRole}) on auth page ${pathname}. Redirecting to ${dash}.`);
    return NextResponse.redirect(new URL(dash, request.url));
  }

  /* ─── everything else: protect based on path prefixes ─── */
  const protectedPrefixes = [roleBasePaths.client, roleBasePaths.admin, roleBasePaths.designer].filter(Boolean); // Filter out any undefined paths
  const needsAuth = protectedPrefixes.some(p => p && pathname.startsWith(p));

  if (needsAuth) {
    if (!user) {
      console.log(`Anonymous user trying to access protected route ${pathname}. Redirecting to login.`);
      const url = new URL('/login', request.url);
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    // User is present, check their role from JWT against the path they are trying to access
    const userRole = (user.app_metadata?.role as UserRole) || 'client'; // Default to client
    const expectedBasePath = roleBasePaths[userRole] || roleBasePaths['client'];

    if (!pathname.startsWith(expectedBasePath)) {
      console.log(`Role mismatch for ${pathname}: User role '${userRole}' (from JWT) attempting to access. Redirecting to ${expectedBasePath}.`);
      return NextResponse.redirect(new URL(expectedBasePath, request.url));
    }
  }
  // If not an auth page, and either not a protected route or user has access, allow.
  // Also handles public non-auth pages like '/' if not explicitly needing redirection when logged in.
  return response;
}

export const config = {
  matcher: [
    '/(.*)',
  ],
}; 