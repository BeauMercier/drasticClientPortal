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

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get request data
    const { projectId, projectType, isActive } = await request.json();
    
    if (!projectId || !projectType) {
      return NextResponse.json(
        { error: 'Missing project ID or type' },
        { status: 400 }
      );
    }
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Determine which table to update based on project type
    const tableName = `${projectType}_projects`;
    
    // Update the project
    const { data, error: updateError } = await adminClient
      .from(tableName)
      .update({ is_active: isActive })
      .eq('id', projectId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error toggling project active state:', updateError);
      return NextResponse.json(
        { error: 'Failed to toggle project active state' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      project: data
    });
  } catch (error) {
    console.error('Error in toggle project API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 