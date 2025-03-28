import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

// Helper to verify admin access
async function verifyAdminAccess() {
  try {
    // Create API client for authentication
    const supabase = createApiClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
    
    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return { authorized: false, error: 'Could not verify user role' };
    }
    
    if (profile.role !== 'admin') {
      return { authorized: false, error: 'Admin access required' };
    }
    
    return { authorized: true, user };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: false, error: 'Error verifying admin access' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Log environment variables for debugging
    console.log("Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("Service Key length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.log("URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Get service key and URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: { 
          hasServiceKey: !!serviceKey, 
          hasSupabaseUrl: !!supabaseUrl 
        }
      });
    }
    
    // Create admin client using our standard function
    const adminClient = createAdminClient();
    
    // Test various operations
    const results = [];
    
    // Test 1: Basic database query
    try {
      const { data: profileCount, error: profileError } = await adminClient
        .from('profiles')
        .select('count');
        
      results.push({
        test: 'Basic DB query (profiles count)',
        success: !profileError,
        data: profileCount,
        error: profileError ? profileError.message : null
      });
    } catch (e) {
      results.push({
        test: 'Basic DB query (profiles count)',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }
    
    // Test 2: Try to access auth config (doesn't require full admin)
    try {
      const { data: authSettings, error: authError } = await adminClient
        .auth
        .getUser('non-existent-id-just-testing-api');
        
      results.push({
        test: 'Auth API access',
        success: !authError,
        error: authError ? authError.message : null
      });
    } catch (e) {
      results.push({
        test: 'Auth API access',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }
    
    // Test 3: Admin API access (listUsers)
    try {
      // Check if admin API is available
      if (typeof adminClient.auth.admin === 'undefined') {
        results.push({
          test: 'Admin API availability',
          success: false,
          error: 'Auth admin API not available in client'
        });
      } else {
        // Test admin.listUsers
        const { data, error } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1
        });
        
        results.push({
          test: 'Admin API access (listUsers)',
          success: !error,
          data: data ? { count: data.users?.length } : null,
          error: error ? error.message : null
        });
      }
    } catch (e) {
      results.push({
        test: 'Admin API access (listUsers)',
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      });
    }
    
    return NextResponse.json({
      success: true,
      serviceKeyFirstChars: serviceKey.substring(0, 10) + '...',
      serviceKeyLength: serviceKey.length,
      serviceKeySegments: serviceKey.split('.').length,
      serviceKeyCharacters: Array.from(serviceKey).map(c => c.charCodeAt(0) > 127 || c.charCodeAt(0) < 32 ? `[${c.charCodeAt(0)}]` : c).join(''),
      results
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 