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

// Define protected routes and required roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  // Client-specific routes
  '/dashboard': ['client', 'admin', 'partner'],
  '/files': ['client', 'admin', 'partner'],
  '/projects': ['client', 'admin', 'partner'],
  '/billing': ['client', 'admin', 'partner'],
  '/settings': ['client', 'admin', 'partner'],
  // Admin-specific routes
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  '/admin/projects': ['admin'],
  '/admin/billing': ['admin'],
  '/admin/support': ['admin'],
  // Designer-specific routes - strictly designer role only
  '/designer': ['designer'],
  '/designer/dashboard': ['designer'],
  '/designer/calendar': ['designer'],
  '/designer/tasks': ['designer'],
  '/designer/projects': ['designer'],
  // Test endpoints 
  '/api/test/designer-role': ['designer', 'admin'],
};

// Routes that should redirect to specific locations based on role
const DESIGNER_ROUTES = ['/designer', '/designer/dashboard', '/designer/calendar', '/designer/tasks', '/designer/projects'];

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

  const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // --- Redirect Logic --- 

  // 1. If NO user AND accessing a protected route
  if (!user && isProtectedRoute) {
    console.log(`Redirecting to login: No user and accessing protected route ${pathname}`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl); // Return direct redirect
  }

  // 2. If USER EXISTS
  if (user) {
    // Redirect logged-in users away from login/register pages
    if (isPublicAuthRoute) {
      console.log(`Redirecting logged-in user away from ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url)); // Return direct redirect
    }

    // Get user role (Assuming profile fetch is needed for role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const userRole = getUserRole({ ...user, role: profile?.role }); 

    // Role-based redirects and access checks
    const isDesignerRoute = DESIGNER_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (userRole === 'designer' && !isDesignerRoute) {
      console.log(`Redirecting designer to designer dashboard from ${pathname}`);
      return NextResponse.redirect(new URL('/designer/dashboard', request.url));
    }

    if (userRole === 'client' && isDesignerRoute) {
      console.log(`Redirecting client away from designer route ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isProtectedRoute) {
      const matchedRoute = Object.keys(PROTECTED_ROUTES).find(route => pathname === route || pathname.startsWith(`${route}/`));
      if (matchedRoute) {
        const allowedRoles = PROTECTED_ROUTES[matchedRoute];
        const hasAccess = allowedRoles.some(role => userRole.toLowerCase().includes(role.toLowerCase()));
        if (!hasAccess) {
          console.log(`Redirecting to dashboard due to role mismatch: ${pathname}, Role: ${userRole}`);
          const dashboardUrl = userRole === 'designer' ? '/designer/dashboard' : '/dashboard';
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
      }
    }
  }

  // Default case: Allow access, return response with potentially updated cookies
  return response;
}

// Keep matcher config
export const config = {
  matcher: [
    // Include all paths, including API routes
    '/(.*)',
  ],
}; 