import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase Admin client with service role that bypasses RLS
function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    throw new Error('Service role key is required for admin operations');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * This API endpoint gets the designer assignments for a specific project
 * 
 * Query parameters:
 * - projectId: string (required)
 * - projectType: 'web_design' | 'logo_design' | 'social_graphics' (required)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Admin Project Assignments API: Starting request');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');
    
    if (!projectId || !projectType) {
      console.error('Admin Project Assignments API: Missing required params');
      return NextResponse.json(
        { error: 'Project ID and project type are required' }, 
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabase = createServiceRoleClient();
    
    // Get assignments with designer information
    const { data, error } = await supabase
      .from('designer_projects')
      .select(`
        id,
        assigned_at,
        designer_id,
        designer:designer_id(
          id,
          email,
          full_name,
          avatar_url
        ),
        assigned_by,
        assigner:assigned_by(
          email,
          full_name
        )
      `)
      .eq('project_id', projectId)
      .eq('project_type', projectType);
      
    if (error) {
      console.error('Admin Project Assignments API: Error fetching assignments:', error);
      return NextResponse.json(
        { error: `Error fetching assignments: ${error.message}` }, 
        { status: 500 }
      );
    }
    
    // Format the response
    const formattedAssignments = data.map(assignment => {
      // Ensure designer is properly typed with explicit access
      const designer = assignment.designer as Record<string, any> || {}; 
      const assigner = assignment.assigner as Record<string, any> || {};
      
      return {
        id: assignment.id,
        assigned_at: assignment.assigned_at,
        designer: {
          id: designer.id,
          email: designer.email,
          name: designer.full_name || designer.email || 'Unknown Designer',
          avatar_url: designer.avatar_url
        },
        assigned_by: assignment.assigner 
          ? {
              email: assigner.email,
              name: assigner.full_name || assigner.email || 'Unknown Admin'
            }
          : null
      };
    });
    
    return NextResponse.json(formattedAssignments);
  } catch (error) {
    console.error('Admin Project Assignments API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? (error as Error).message : String(error)) }, 
      { status: 500 }
    );
  }
}

/**
 * This API endpoint creates or updates a designer assignment for a project
 * 
 * Body parameters:
 * - projectId: string (required)
 * - projectType: 'web_design' | 'logo_design' | 'social_graphics' (required)
 * - designerId: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Admin Project Assignments API: Processing assignment request');
    
    // Parse the request body
    const body = await request.json();
    const { projectId, projectType, designerId } = body;
    
    if (!projectId || !projectType || !designerId) {
      console.error('Admin Project Assignments API: Missing required fields');
      return NextResponse.json(
        { error: 'Project ID, project type, and designer ID are required' }, 
        { status: 400 }
      );
    }
    
    // Validate project type
    if (!['web_design', 'logo_design', 'social_graphics'].includes(projectType)) {
      return NextResponse.json(
        { error: 'Invalid project type. Must be one of: web_design, logo_design, social_graphics' }, 
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabase = createServiceRoleClient();
    
    // Verify the designer exists
    const { data: designer, error: designerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', designerId)
      .single();
      
    if (designerError) {
      console.error('Admin Project Assignments API: Error finding designer:', designerError);
      return NextResponse.json(
        { error: 'Designer not found' }, 
        { status: 404 }
      );
    }
    
    // Verify the designer is actually a designer
    if (designer.role !== 'designer') {
      console.error(`Admin Project Assignments API: User ${designerId} is not a designer (role: ${designer.role})`);
      return NextResponse.json(
        { error: 'The specified user is not a designer' }, 
        { status: 400 }
      );
    }
    
    // Get the current admin user's ID for the assigned_by field
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Admin Project Assignments API: Error getting current user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' }, 
        { status: 401 }
      );
    }
    
    // Check if this designer is already assigned to this project
    const { data: existingAssignment, error: checkError } = await supabase
      .from('designer_projects')
      .select('id')
      .eq('project_id', projectId)
      .eq('project_type', projectType)
      .eq('designer_id', designerId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Admin Project Assignments API: Error checking existing assignment:', checkError);
      // Continue anyway
    }
    
    if (existingAssignment) {
      console.log(`Admin Project Assignments API: Designer ${designerId} already assigned to project ${projectId}`);
      return NextResponse.json({
        success: true,
        message: 'Designer was already assigned to this project',
        assignment: existingAssignment
      });
    }
    
    // First remove any existing assignments for this project
    const { error: deleteError } = await supabase
      .from('designer_projects')
      .delete()
      .eq('project_id', projectId)
      .eq('project_type', projectType);
      
    if (deleteError) {
      console.error('Admin Project Assignments API: Error removing previous designer assignments:', deleteError);
      // Continue anyway
    }
    
    // Then add the new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from('designer_projects')
      .insert({
        designer_id: designerId,
        project_id: projectId,
        project_type: projectType,
        assigned_by: user.id
      })
      .select('id')
      .single();
      
    if (insertError) {
      console.error('Admin Project Assignments API: Error creating designer assignment:', insertError);
      return NextResponse.json(
        { error: `Error assigning designer: ${insertError.message}` }, 
        { status: 500 }
      );
    }
    
    console.log(`Admin Project Assignments API: Designer ${designerId} assigned to project ${projectId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Designer assigned successfully',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Admin Project Assignments API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? (error as Error).message : String(error)) }, 
      { status: 500 }
    );
  }
}

/**
 * This API endpoint removes a designer assignment from a project
 * 
 * Query parameters:
 * - projectId: string (required)
 * - projectType: 'web_design' | 'logo_design' | 'social_graphics' (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('Admin Project Assignments API: Processing unassignment request');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');
    
    if (!projectId || !projectType) {
      console.error('Admin Project Assignments API: Missing required params');
      return NextResponse.json(
        { error: 'Project ID and project type are required' }, 
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabase = createServiceRoleClient();
    
    // Remove all assignments for this project
    const { error: deleteError } = await supabase
      .from('designer_projects')
      .delete()
      .eq('project_id', projectId)
      .eq('project_type', projectType);
      
    if (deleteError) {
      console.error('Admin Project Assignments API: Error removing designer assignments:', deleteError);
      return NextResponse.json(
        { error: `Error removing assignments: ${deleteError.message}` }, 
        { status: 500 }
      );
    }
    
    console.log(`Admin Project Assignments API: All designers unassigned from project ${projectId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Designer assignments removed successfully'
    });
  } catch (error) {
    console.error('Admin Project Assignments API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? (error as Error).message : String(error)) }, 
      { status: 500 }
    );
  }
} 