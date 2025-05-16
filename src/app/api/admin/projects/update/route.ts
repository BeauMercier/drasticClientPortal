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
    
    console.log('Admin Update Project API: Starting request');
    
    // Parse the request body
    const body = await request.json();
    console.log('Admin Update Project API: Request body:', body);
    
    const { projectId, projectType, updates, title, description, status, active, designer_email } = body;
    
    // Explicitly check if current_stage is being set to null in the updates object
    if (updates && typeof updates === 'object' && updates.current_stage === null) {
      console.error('Admin Update Project API: Attempt to set current_stage to null is forbidden.');
      return NextResponse.json(
        { error: 'Setting current_stage to null is not allowed. Use the dedicated stage update API for changes.' }, 
        { status: 400 }
      );
    }
    
    if (!projectId || !projectType) {
      console.error('Admin Update Project API: Missing required fields');
      return NextResponse.json(
        { error: 'Project ID and project type are required' }, 
        { status: 400 }
      );
    }
    
    // Use admin client
    const adminClient = createAdminClient();
    
    // Determine which table to update based on project type
    let tableName;
    switch (projectType) {
      case 'web_design':
        tableName = 'web_design_projects';
        break;
      case 'logo_design':
        tableName = 'logo_design_projects';
        break;
      case 'social_graphics':
        tableName = 'social_graphics_projects';
        break;
      default:
        console.error('Admin Update Project API: Invalid project type:', projectType);
        return NextResponse.json(
          { error: 'Invalid project type' }, 
          { status: 400 }
        );
    }
    
    // Create update data object with only the fields that were provided
    // First check if updates object was provided and use that
    let updateData: Record<string, unknown> = {};
    
    if (updates && typeof updates === 'object') {
      // If updates object was provided, use it directly
      updateData = { ...updates };
      
      // Convert empty string timestamps to null
      const timestampFields = ['deadline', 'discovery_date', 'concept_development_date', 
                              'refinement_date', 'finalization_date', 'delivery_date',
                              'approval_date'];
      
      for (const field of timestampFields) {
        if (updateData[field] === '') {
          updateData[field] = null;
        }
      }
      
      console.log(`Admin Update Project API: Using provided updates object for ${tableName} project ${projectId}`, updateData);
    } else {
      // Otherwise build from individual fields
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (active !== undefined) updateData.active = active;
      console.log(`Admin Update Project API: Built updates from fields for ${tableName} project ${projectId}`, updateData);
    }
    
    // Always include updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Check if there are actual changes to apply
    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      console.log(`Admin Update Project API: No actual changes to apply for ${tableName} project ${projectId}`);
      // Even if there are no changes we want to return a success response, not an error
      return NextResponse.json({
        success: true,
        message: 'No changes needed',
      });
    }
    
    console.log(`Admin Update Project API: Updating ${tableName} project ${projectId}`, updateData);
    
    // Update the project
    if (Object.keys(updateData).length <= 1) {
      // If we only have updated_at or no fields at all, just fetch the project
      // instead of trying to update with no real changes
      console.log(`Admin Update Project API: No significant changes to apply, fetching project directly`);
      const { data, error } = await adminClient
        .from(tableName)
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) {
        console.error(`Admin Update Project API: Error fetching project:`, error);
        return NextResponse.json(
          { error: `Error fetching project: ${error.message}` }, 
          { status: error.code === 'PGRST116' ? 404 : 500 }
        );
      }
      
      console.log('Admin Update Project API: Successfully retrieved project without updates');
      return NextResponse.json({
        success: true,
        message: 'No changes needed',
        project: data
      });
    } else {
      // Otherwise proceed with the update as normal
      const { data, error } = await adminClient
        .from(tableName)
        .update(updateData)
        .eq('id', projectId)
        .select('*')
        .single();
      
      if (error) {
        console.error(`Admin Update Project API: Error updating ${tableName}:`, error);
        return NextResponse.json(
          { error: `Error updating project: ${error.message}` }, 
          { status: 500 }
        );
      }
      
      // Handle designer assignment separately using the join table
      if (designer_email !== undefined) {
        try {
          // If designer email is empty, remove any existing assignments
          if (!designer_email) {
            console.log(`Admin Update Project API: Removing designer assignments for project ${projectId}`);
            
            const { error: deleteError } = await adminClient
              .from('designer_projects')
              .delete()
              .eq('project_id', projectId)
              .eq('project_type', projectType);
              
            if (deleteError) {
              console.error('Admin Update Project API: Error removing designer assignment:', deleteError);
              // Continue anyway, as this is not critical
            }
          } else {
            // Look up the user by email
            const { data: userData, error: userError } = await adminClient
              .from('profiles')
              .select('id, email, full_name')
              .eq('email', designer_email)
              .single();
            
            if (userError) {
              console.error('Admin Update Project API: Error finding designer:', userError);
              return NextResponse.json(
                { error: `Could not find designer with email ${designer_email}` }, 
                { status: 404 }
              );
            }
            
            // Get the current admin user's ID for the assigned_by field
            const { data: { user } } = await adminClient.auth.getUser();
            
            // Check if this designer is already assigned to this project
            const { data: existingAssignment, error: checkError } = await adminClient
              .from('designer_projects')
              .select('id')
              .eq('project_id', projectId)
              .eq('project_type', projectType)
              .eq('designer_id', userData.id)
              .single();
              
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
              console.error('Admin Update Project API: Error checking existing assignment:', checkError);
              // Continue anyway
            }
            
            if (!existingAssignment) {
              // First remove any existing assignments for this project
              const { error: deleteError } = await adminClient
                .from('designer_projects')
                .delete()
                .eq('project_id', projectId)
                .eq('project_type', projectType);
                
              if (deleteError) {
                console.error('Admin Update Project API: Error removing previous designer assignments:', deleteError);
                // Continue anyway
              }
              
              // Then add the new assignment
              const { error: insertError } = await adminClient
                .from('designer_projects')
                .insert({
                  designer_id: userData.id,
                  project_id: projectId,
                  project_type: projectType,
                  assigned_by: user?.id
                });
                
              if (insertError) {
                console.error('Admin Update Project API: Error creating designer assignment:', insertError);
                return NextResponse.json(
                  { error: `Error assigning designer: ${insertError.message}` }, 
                  { status: 500 }
                );
              }
              
              console.log(`Admin Update Project API: Designer ${userData.email} assigned to project ${projectId}`);
            } else {
              console.log(`Admin Update Project API: Designer ${userData.email} already assigned to project ${projectId}`);
            }
          }
        } catch (err) {
          console.error('Admin Update Project API: Error handling designer assignment:', err);
          return NextResponse.json(
            { error: 'Failed to update designer assignment' }, 
            { status: 500 }
          );
        }
      }
      
      console.log('Admin Update Project API: Update successful');
      return NextResponse.json({
        success: true,
        message: 'Project updated successfully',
        project: data
      });
    }
  } catch (error) {
    console.error('Admin Update Project API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 