import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server'; // Use admin client for broader access initially

interface Params {
  params: { projectId: string };
}

// Authorization check helper
async function canUserAccessProject(userId: string, projectId: string, projectType: string): Promise<boolean> {
  try {
    const supabase = createAdminClient(); // Use admin client to bypass RLS for check

    // 1. Check if user is the owner (client)
    const { data: projectOwner, error: ownerError } = await supabase
      .from(projectType === 'web_design' ? 'web_design_projects' :
            projectType === 'logo_design' ? 'logo_design_projects' :
            'social_graphics_projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (ownerError) {
        console.error(`Error checking project owner for ${projectId}:`, ownerError);
        // Fall through to check assignment
    }
    
    if (projectOwner?.user_id === userId) {
      return true; // User is the owner
    }

    // 2. Check if user is assigned designer
    const { data: assignment, error: assignmentError } = await supabase
      .from('designer_projects')
      .select('id')
      .eq('project_id', projectId)
      .eq('project_type', projectType)
      .eq('designer_id', userId)
      .maybeSingle();

    if (assignmentError) {
        console.error(`Error checking designer assignment for ${projectId}:`, assignmentError);
        return false;
    }
    
    return !!assignment; // True if an assignment exists for this user/project/type

  } catch (error) {
    console.error('Error in canUserAccessProject:', error);
    return false;
  }
}

/**
 * @swagger
 * /api/projects/social_graphics/{projectId}:
 *   get:
 *     summary: Fetch detailed social graphics project information (Client/Designer)
 *     description: Retrieves detailed information for a specific social graphics project if the authenticated user is the owner (client) or the assigned designer.
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the social graphics project.
 *     responses:
 *       200:
 *         description: Project details fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Add specific schema for SocialGraphicsProject + client + designer_assignment
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Forbidden (user does not have access).
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { projectId } = params;
    const projectType = 'social_graphics'; // Hardcoded for this route file
    
    // Authenticate user first
    const supabaseUserClient = createApiClient();
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Authorize: Check if user can access this project
    const authorized = await canUserAccessProject(user.id, projectId, projectType);
    if (!authorized) {
      // Check if project exists at all (for 404 vs 403)
      const adminClientCheck = createAdminClient();
      const { data: existsCheck } = await adminClientCheck.from('social_graphics_projects').select('id').eq('id', projectId).maybeSingle();
      if (!existsCheck) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Forbidden: You do not have access to this project' }, { status: 403 });
    }

    // User is authenticated and authorized, fetch details using admin client
    const adminClient = createAdminClient();
    
    // Fetch project details
    const { data: projectData, error: projectError } = await adminClient
      .from('social_graphics_projects')
      .select('*, client:user_id (id, full_name, email, company)')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      console.error('Error fetching social_graphics_project details (authed):', projectError);
      return NextResponse.json({ error: `Failed to fetch project details: ${projectError.message}` }, { status: 500 });
    }
    
    if (!projectData) {
      return NextResponse.json({ error: 'Project not found after authorization' }, { status: 404 }); 
    }

    // Fetch assignment details separately
    const { data: assignmentData, error: assignmentError } = await adminClient
      .from('designer_projects')
      .select('*, designer:designer_id (id, full_name, email)')
      .eq('project_id', projectId)
      .eq('project_type', projectType)
      .maybeSingle();
      
    if (assignmentError) {
        console.warn(`Could not fetch assignment details for project ${projectId} (authed): ${assignmentError.message}`);
    }
    
    // Combine data
    const combinedData = {
        ...projectData,
        designer_assignment: assignmentData?.designer || null,
    };

    return NextResponse.json(combinedData);

  } catch (error: any) {
    console.error('Unexpected error in GET handler:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch project details due to server error' }, { status: 500 });
  }
} 