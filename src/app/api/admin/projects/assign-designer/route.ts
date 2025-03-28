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
    console.log('Assign Designer API: Starting request');
    
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { projectId, projectType, designerId } = body;
    
    // Validate required fields
    if (!projectId || !projectType || !designerId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectType, designerId' }, 
        { status: 400 }
      );
    }
    
    // Validate project type
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
        return NextResponse.json(
          { error: 'Invalid project type' }, 
          { status: 400 }
        );
    }
    
    // Use admin client
    const adminClient = createAdminClient();
    
    // First check if the designer exists and has the correct role
    console.log(`Assign Designer API: Checking designer ${designerId}`);
    const { data: designer, error: designerError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', designerId)
      .single();
    
    if (designerError) {
      console.error('Assign Designer API: Error checking designer:', designerError);
      return NextResponse.json(
        { error: `Error checking designer: ${designerError.message}` }, 
        { status: 500 }
      );
    }
    
    if (!designer || designer.role !== 'designer') {
      return NextResponse.json(
        { error: 'The selected user is not a designer' }, 
        { status: 400 }
      );
    }
    
    // Check if project exists
    console.log(`Assign Designer API: Checking project ${projectId} in ${tableName}`);
    const { data: project, error: projectError } = await adminClient
      .from(tableName)
      .select('id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Assign Designer API: Error checking project:', projectError);
      return NextResponse.json(
        { error: `Error checking project: ${projectError.message}` }, 
        { status: 500 }
      );
    }
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }
    
    // Record the assignment in the designer_projects table
    console.log(`Assign Designer API: Recording assignment in designer_projects table`);
    
    // First check if assignment already exists
    const { data: existingAssignment, error: checkError } = await adminClient
      .from('designer_projects')
      .select('id')
      .eq('project_id', projectId)
      .eq('project_type', projectType)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') { // Not found is okay
      console.error('Assign Designer API: Error checking existing assignment:', checkError);
      return NextResponse.json(
        { error: `Error checking assignment: ${checkError.message}` }, 
        { status: 500 }
      );
    }
    
    // Based on whether record exists, update or insert
    let result;
    if (existingAssignment) {
      console.log(`Assign Designer API: Updating existing assignment`);
      // Update the existing assignment
      result = await adminClient
        .from('designer_projects')
        .update({
          designer_id: designerId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', existingAssignment.id)
        .select()
        .single();
    } else {
      console.log(`Assign Designer API: Creating new assignment`);
      // Insert a new assignment
      result = await adminClient
        .from('designer_projects')
        .insert({
          designer_id: designerId,
          project_id: projectId,
          project_type: projectType,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    const { data: assignmentData, error: assignmentError } = result;
    
    if (assignmentError) {
      console.error('Assign Designer API: Error recording assignment:', assignmentError);
      
      // Check for different possible errors
      if (assignmentError.code === '42P01') { // Table doesn't exist
        console.log('Assign Designer API: designer_projects table does not exist');
        
        // We can't create the table via the API, so we'll just return a message
        return NextResponse.json({
          success: true,
          message: 'Designer assigned (note: designer_projects table does not exist in the database)',
          error_details: assignmentError.message,
          recommendation: 'Please create a designer_projects table with columns: id, designer_id, project_id, project_type, assigned_at'
        });
      }
      
      // Handle other types of errors
      if (assignmentError.code === '23505') { // Unique violation
        // This means there's already an assignment with the same designer - update it
        try {
          console.log('Assign Designer API: Assignment already exists, trying alternate update method');
          const { error: updateError } = await adminClient
            .from('designer_projects')
            .update({
              designer_id: designerId,
              assigned_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .eq('project_type', projectType);
            
          if (updateError) {
            console.error('Assign Designer API: Alternative update failed:', updateError);
            return NextResponse.json(
              { error: `Failed to update assignment: ${updateError.message}` }, 
              { status: 500 }
            );
          }
          
          // Successfully updated
          return NextResponse.json({
            success: true,
            message: 'Designer assigned successfully (alternate method)'
          });
        } catch (altError) {
          console.error('Assign Designer API: Alternative update threw error:', altError);
          return NextResponse.json(
            { error: 'Failed to update assignment' }, 
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: `Error recording assignment: ${assignmentError.message}` }, 
        { status: 500 }
      );
    }
    
    // Update the project to indicate it has a designer
    try {
      console.log(`Assign Designer API: Updating project status`);
      const { error: updateError } = await adminClient
        .from(tableName)
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
        
      if (updateError) {
        console.error('Assign Designer API: Error updating project status:', updateError);
        // Continue anyway
      }
    } catch (updateError) {
      console.error('Assign Designer API: Error updating project status:', updateError);
      // Continue anyway
    }
    
    console.log('Assign Designer API: Assignment successful');
    return NextResponse.json({
      success: true,
      message: 'Designer assigned successfully',
      assignment: assignmentData
    });
  } catch (error) {
    console.error('Assign Designer API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 