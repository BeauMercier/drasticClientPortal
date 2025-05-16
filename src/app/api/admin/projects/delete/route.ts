import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api/server';
import { createApiClient } from '@/lib/api/server-utils'; // For admin verification

export const dynamic = 'force-dynamic';

// Helper to verify admin access (can be refactored into a shared util if used in multiple places)
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

/**
 * DELETE endpoint to remove a project
 * 
 * Required parameters in the request body:
 * - projectId: The ID of the project to delete
 * - projectType: The type of project ('web_design', 'logo_design', or 'social_graphics')
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAccess = await verifyAdminAccess();
    if (!adminAccess.authorized) {
      return NextResponse.json({ error: adminAccess.error || 'Unauthorized' }, { status: 403 });
    }

    const { projectId, projectType } = await request.json();

    if (!projectId || !projectType) {
      return NextResponse.json(
        { error: 'Project ID and Project Type are required' }, 
        { status: 400 }
      );
    }

    let tableName: string;
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
          { error: `Invalid project type: ${projectType}` },
          { status: 400 }
        );
    }

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient
      .from(tableName)
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error(`Error deleting project ${projectId} from ${tableName}:`, deleteError);
      return NextResponse.json(
        { error: `Failed to delete project: ${deleteError.message}` }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Error in delete project API:', error);
    const message = error instanceof Error ? error.message : 'Server error processing delete request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 