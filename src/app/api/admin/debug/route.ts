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
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Get environment info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    };
    
    // Check Supabase connection
    const { data: connectionTest, error: connectionError } = await adminClient
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
      
    // Get database stats  
    const { data: dbStats, error: dbError } = await adminClient.rpc('get_db_stats');
    
    return NextResponse.json({
      status: 'success',
      environment: envInfo,
      connection: {
        success: !connectionError,
        error: connectionError ? connectionError.message : null,
        counts: connectionTest
      },
      database: {
        stats: dbStats,
        error: dbError ? dbError.message : null
      }
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 