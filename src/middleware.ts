import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getUserRole } from './lib/utils';

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
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    },
  );

  // Get the user (more secure than getSession)
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // If authentication error, log it but don't block static assets
    if (error) {
      console.error(`Auth error in middleware (${pathname}):`, error.message);
      
      // For non-static assets, redirect unauthenticated users
      const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|css|js|ico)$/) || 
                           pathname.startsWith('/images/') ||
                           pathname.startsWith('/_next/');
      
      // Don't redirect for static assets, API routes, or login-related paths
      const shouldRedirect = !isStaticAsset && 
                           !isApiRoute && 
                           !pathname.startsWith('/login') &&
                           !pathname.startsWith('/register') &&
                           !pathname.startsWith('/reset-password');
      
      const isProtRoute = Object.keys(PROTECTED_ROUTES).some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      if (shouldRedirect && isProtRoute) {
        // Redirect to login page with return URL
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectedFrom', pathname);
        console.log(`Redirecting to login due to auth error: ${pathname}`);
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Log authentication state for debugging
    console.log(`Middleware auth check - Path: ${pathname}, Authenticated: ${!!user}`);
    
    // For API routes, we just want to ensure cookies are processed but not perform redirects
    if (isApiRoute) {
      // Return a response with the updated cookies
      const response = NextResponse.next();
      
      // Copy any cookies that were set by the supabase client
      const cookiesToSet = request.cookies.getAll();
      cookiesToSet.forEach(cookie => {
        response.cookies.set(cookie);
      });
      
      return response;
    }

    // For non-API routes, continue with regular auth checks
    // If no user and trying to access protected route
    if (!user) {
      const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );

      if (isProtectedRoute) {
        // Redirect to login page with return URL
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // For unprotected routes, allow access
      return NextResponse.next();
    }

    // Get user role from profile - do this early to have it available for all checks
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = getUserRole({...user, role: profile?.role});

    // SPECIAL ROLE-BASED HANDLING:
    // If designer trying to access non-designer pages, redirect to designer dashboard
    if (userRole === 'designer') {
      // Skip static asset paths
      const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|css|js|ico)$/) || 
                            pathname.startsWith('/images/') ||
                            pathname.startsWith('/_next/');
      
      if (isStaticAsset) {
        return NextResponse.next();
      }
      
      const isDesignerRoute = DESIGNER_ROUTES.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      // If not already on a designer route, redirect to designer dashboard
      if (!isDesignerRoute) {
        return NextResponse.redirect(new URL('/designer/dashboard', request.url));
      }
    }
    
    // If client trying to access designer pages, redirect to client dashboard
    if (userRole === 'client') {
      const isDesignerRoute = DESIGNER_ROUTES.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );
      
      if (isDesignerRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // If session exists and accessing protected route
    const isProtectedRoute = Object.keys(PROTECTED_ROUTES).some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
      // Find the matching route
      const matchedRoute = Object.keys(PROTECTED_ROUTES).find(route => 
        pathname === route || pathname.startsWith(`${route}/`)
      );

      if (matchedRoute) {
        // Check if user's role is allowed for this route
        const allowedRoles = PROTECTED_ROUTES[matchedRoute];
        const hasAccess = allowedRoles.some(role => 
          userRole.toLowerCase().includes(role.toLowerCase())
        );
        
        if (!hasAccess) {
          // For other routes, redirect to appropriate dashboard
          if (userRole === 'designer') {
            return NextResponse.redirect(new URL('/designer/dashboard', request.url));
          } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      }
    }

    // Default case: allow access
    return NextResponse.next();
  } catch (e) {
    console.error(`Exception in middleware auth check (${pathname}):`, e);
    // Continue to avoid breaking the application completely
    return NextResponse.next();
  }
}

// Optionally configure the middleware to match specific paths
export const config = {
  matcher: [
    // Include all paths, including API routes
    // This ensures auth cookies are properly processed for API requests
    '/(.*)',
  ],
}; 