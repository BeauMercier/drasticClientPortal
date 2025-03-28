import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { z } from 'zod';

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

// Input validation schema
const toggleStatusSchema = z.object({
  projectId: z.string().uuid({
    message: 'Invalid project ID format'
  }),
  newStatus: z.enum(['pending', 'active', 'completed', 'cancelled'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: pending, active, completed, cancelled'
  })
});

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = toggleStatusSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json(
        { error: 'Validation error', details: errors },
        { status: 400 }
      );
    }

    const { projectId, newStatus } = validationResult.data;
    
    // Use admin client
    const adminClient = createAdminClient();

    // Determine project type by looking in each table
    const projectTables = ['web_design_projects', 'logo_design_projects', 'social_graphics_projects'];
    let tableName = '';
    let projectType = '';
    let existingProject = null;
    
    // Find the project in one of the tables
    for (const table of projectTables) {
      const { data, error } = await adminClient
        .from(table)
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (!error && data) {
        tableName = table;
        projectType = table.replace('_projects', '');
        existingProject = data;
        break;
      }
    }
    
    if (!tableName || !existingProject) {
      return NextResponse.json(
        { error: 'Project not found in any table' },
        { status: 404 }
      );
    }
    
    console.log(`Updating project ${projectId} in table ${tableName} to status ${newStatus}`);

    // Update project status in the correct table
    const { data: updatedProject, error: updateError } = await adminClient
      .from(tableName)
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating project status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project status', details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create notification for status change
    const { error: notificationError } = await adminClient
      .from('notifications')
      .insert({
        user_id: updatedProject.client_id || updatedProject.user_id, // Handle different field names
        type: 'project_status_change',
        message: `Project "${updatedProject.name || updatedProject.title}" status has been changed to ${newStatus}`,
        metadata: JSON.stringify({
          project_id: projectId,
          previous_status: existingProject.status,
          new_status: newStatus
        }),
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue execution - notification failure shouldn't fail the status change
    }

    return NextResponse.json({
      success: true,
      message: `Project status successfully updated to ${newStatus}`,
      project: updatedProject
    });
  } catch (error) {
    console.error('Unexpected error toggling project status:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' + (error instanceof Error ? ': ' + error.message : '') },
      { status: 500 }
    );
  }
} 