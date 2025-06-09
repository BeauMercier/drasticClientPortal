import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

async function verifyAdminAccess() {
  try {
    const supabase = createApiClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
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
  { params }: { params: { type: string; projectId: string } }
) {
  try {
    const { authorized, error } = await verifyAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    const { type, projectId } = params;
    
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
        return NextResponse.json({ error: 'Invalid project type' }, { status: 400 });
    }
    
    const adminClient = createAdminClient();
    
    const { data: projectData, error: projectError } = await adminClient
      .from(tableName)
      .select(`*`)
      .eq('id', projectId)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ error: `Error fetching project: ${projectError.message}` }, { status: 500 });
    }

    const { data: birRow, error: birError } = await adminClient
        .from('business_information_requests')
        .select('id, status, submitted_at, answers')
        .eq('project_id', projectId)
        .single();

    if (birError && birError.code !== 'PGRST116') {
        console.error(`[Admin API] Error fetching BIR for project ${projectId}:`, birError);
        return NextResponse.json({ error: "An error occurred while fetching the project's business information." }, { status: 500 });
    }
    
    const designerInfo = null;
    
    const { data: ownerProfile, error: ownerError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, company')
      .eq('id', projectData.user_id)
      .single();
    
    if (ownerError) {
      console.error(`Project Details API: Error fetching owner:`, ownerError);
    }

    return NextResponse.json({
      ...projectData,
      bir: birRow || null,
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