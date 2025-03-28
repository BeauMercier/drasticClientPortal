import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestResponse } from '@supabase/supabase-js';

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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    
    // Create admin client for fetching projects
    const adminClient = createAdminClient();
    
    // Get the table name based on type
    const tableName = type ? `${type}_projects` : 'web_design_projects';
    
    // Create the base query
    let query = adminClient.from(tableName).select('*, profiles:user_id(full_name)');
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Fetch data
    const { data, error: queryError } = await query;
    
    if (queryError) {
      console.error('Error fetching projects:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin projects API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 