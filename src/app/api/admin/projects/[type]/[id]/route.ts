import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { WebDesignProject } from '@/lib/types/project';
import { BirRow } from '@/lib/types/bir';

export const dynamic = 'force-dynamic';

interface ProjectWithBir {
  project: WebDesignProject;
  bir: BirRow | null;
}

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
    
    // [BIR TRACE] Log parameters
    console.log('[BIR TRACE] params', { type, id });

    // Build and execute the query to get the project
    const { data: projectData, error: projectError } = await adminClient
      .from(tableName)
      .select(`*`)
      .eq('id', id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error(`Project Details API: Error fetching project:`, projectError);
      return NextResponse.json({ error: `Error fetching project: ${projectError.message}` }, { status: 500 });
    }

    // Explicitly fetch the Business Information Request in a separate query
    // This is the correct pattern for the current DB schema which lacks a direct FK relationship for nesting.
    const { data: birData, error: birError } = await adminClient
      .from('business_information_requests')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();

    if (birError) {
        // Log the error but do not fail the entire request, as a project may not have a BIR.
        console.error(`[Admin API] Error fetching BIR for project ${id}:`, birError);
    }

    // The designer assignment logic is currently disabled.
    const designerInfo = null;
    
    // Get the project owner's information
    console.log(`Project Details API: Fetching project owner info`);
    const { data: ownerProfile, error: ownerError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, company')
      .eq('id', projectData.user_id)
      .single();
    
    if (ownerError) {
      console.error(`Project Details API: Error fetching owner:`, ownerError);
      // Continue anyway, just provide the project without owner
    }

    return NextResponse.json({
      ...projectData,
      bir: birData || null, // Pass the fetched BIR data, ensuring it's null if not found
      client: ownerProfile || null,
      designer_assignment: designerInfo,
    });
  } catch (error) {
    console.error('Project Details API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 