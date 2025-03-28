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

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    console.log(`Project Details API: Starting request for ${params.type}/${params.id}`);
    
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    const { type, id } = params;
    
    // Validate project type
    let tableName;
    switch (type) {
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
        console.error('Project Details API: Invalid project type:', type);
        return NextResponse.json(
          { error: 'Invalid project type' }, 
          { status: 400 }
        );
    }
    
    // Use admin client
    const adminClient = createAdminClient();
    
    // Get the project
    console.log(`Project Details API: Fetching ${tableName} project with ID ${id}`);
    const { data: project, error: projectError } = await adminClient
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) {
      console.error(`Project Details API: Error fetching project:`, projectError);
      return NextResponse.json(
        { error: `Error fetching project: ${projectError.message}` }, 
        { status: projectError.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    // Get the project owner's information
    console.log(`Project Details API: Fetching project owner info`);
    const { data: ownerProfile, error: ownerError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, company')
      .eq('id', project.user_id)
      .single();
    
    if (ownerError) {
      console.error(`Project Details API: Error fetching owner:`, ownerError);
      // Continue anyway, just provide the project without owner
    }
    
    // Try to get designer assignment information from the junction table
    let designerAssignment = null;
    try {
      console.log(`Project Details API: Checking for designer assignment`);
      const { data: assignment, error: assignmentError } = await adminClient
        .from('designer_projects')
        .select('designer_id, assigned_at')
        .eq('project_id', id)
        .eq('project_type', type)
        .maybeSingle();
      
      if (!assignmentError && assignment) {
        console.log(`Project Details API: Found designer assignment, fetching designer info`);
        // Get the designer's profile
        const { data: designerProfile, error: designerError } = await adminClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.designer_id)
          .single();
        
        if (!designerError && designerProfile) {
          designerAssignment = {
            designer_id: assignment.designer_id,
            assigned_at: assignment.assigned_at,
            designer_name: designerProfile.full_name,
            designer_email: designerProfile.email
          };
        } else {
          // Designer profile not found, but still have the ID
          designerAssignment = {
            designer_id: assignment.designer_id,
            assigned_at: assignment.assigned_at
          };
        }
      }
    } catch (error) {
      console.warn(`Project Details API: Error checking designer assignment:`, error);
      // Continue without designer info
    }
    
    // Return a project data object with owner and designer info
    console.log('Project Details API: Request successful');
    return NextResponse.json({
      project: {
        ...project,
        owner: ownerProfile || null,
        designer_assignment: designerAssignment
      }
    });
  } catch (error) {
    console.error('Project Details API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 