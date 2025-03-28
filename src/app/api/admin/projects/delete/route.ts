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

/**
 * DELETE endpoint to remove a project
 * 
 * Required parameters in the request body:
 * - projectId: The ID of the project to delete
 * - projectType: The type of project ('web_design', 'logo_design', or 'social_graphics')
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('Admin Delete Project API: Starting request');
    
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');
    
    if (!projectId || !projectType) {
      console.error('Admin Delete Project API: Missing required parameters');
      return NextResponse.json(
        { error: 'Project ID and project type are required' }, 
        { status: 400 }
      );
    }
    
    // Validate project type
    if (!['web_design', 'logo_design', 'social_graphics'].includes(projectType)) {
      console.error('Admin Delete Project API: Invalid project type:', projectType);
      return NextResponse.json(
        { error: 'Invalid project type. Must be one of: web_design, logo_design, social_graphics' }, 
        { status: 400 }
      );
    }
    
    // Map project type to table name
    const tableMap: Record<string, string> = {
      'web_design': 'web_design_projects',
      'logo_design': 'logo_design_projects',
      'social_graphics': 'social_graphics_projects'
    };
    
    const tableName = tableMap[projectType];
    console.log(`Admin Delete Project API: Deleting from table ${tableName}, project ID ${projectId}`);
    
    // Use admin client
    const adminClient = createAdminClient();
    
    // Step 1: Remove any assignments first (to prevent foreign key conflicts)
    try {
      console.log('Admin Delete Project API: Removing designer assignments');
      const { error: assignmentError } = await adminClient
        .from('designer_projects')
        .delete()
        .eq('project_id', projectId)
        .eq('project_type', projectType);
      
      if (assignmentError) {
        console.warn('Admin Delete Project API: Error removing assignments, proceeding anyway:', assignmentError);
        // Continue with deletion even if this fails
      }
    } catch (error) {
      console.warn('Admin Delete Project API: Error removing assignments, proceeding anyway:', error);
      // Continue with deletion even if this fails
    }
    
    // Step 2: Delete the project
    const { error: deleteError } = await adminClient
      .from(tableName)
      .delete()
      .eq('id', projectId);
    
    if (deleteError) {
      console.error('Admin Delete Project API: Error deleting project:', deleteError);
      return NextResponse.json(
        { error: `Error deleting project: ${deleteError.message}` }, 
        { status: 500 }
      );
    }
    
    console.log('Admin Delete Project API: Project deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('Admin Delete Project API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 