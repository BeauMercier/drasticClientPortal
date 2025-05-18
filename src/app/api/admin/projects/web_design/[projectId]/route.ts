import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

interface Params {
  params: { projectId: string };
}

// Helper to verify admin access (copied for simplicity, consider refactoring to shared util)
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
 * @swagger
 * /api/admin/projects/web_design/{projectId}:
 *   get:
 *     summary: Fetch detailed web design project information (Admin)
 *     description: Retrieves detailed information for a specific web design project, including client and assigned designer data. Requires admin privileges.
 *     tags: [Admin Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the web design project.
 *     responses:
 *       200:
 *         description: Project details fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # Add specific schema for WebDesignProject + client + designer_assignment
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Admin access required.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
export async function GET(request: NextRequest, { params }: Params) {
  await requireAuth(); // Ensure user is authenticated

  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const { authorized, error: authError } = await verifyAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Step 1: Fetch specific project details, joining with client info
    const { data: projectData, error: projectError } = await adminClient
      .from('web_design_projects')
      .select(`
        *,
        client:user_id (id, full_name, email, company)
      `)
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      console.error('Error fetching web_design_project details:', projectError);
      return NextResponse.json({ error: `Failed to fetch project details: ${projectError.message}` }, { status: 500 });
    }

    if (!projectData) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Step 2: Fetch assignment details separately
    const { data: assignmentData, error: assignmentError } = await adminClient
      .from('designer_projects')
      .select('*, designer:designer_id (id, full_name, email)')
      .eq('project_id', projectId)
      .eq('project_type', 'web_design') // Ensure we only get for web_design type
      .maybeSingle();

    if (assignmentError) {
      // Log warning but don't fail the request, project might not have a designer
      console.warn('Error fetching designer assignment:', assignmentError);
    }
    
    // Step 2b: Fetch BIR details
    let birData = null;
    const { data: birResult, error: birError } = await adminClient
      .from('business_information_requests')
      .select('id, status')
      .eq('project_id', projectId)
      .maybeSingle();

    if (birError) {
      // Log warning but don't fail the request, BIR might not exist yet
      console.warn('Error fetching BIR details:', birError);
    } else if (birResult) {
      birData = {
        bir_id: birResult.id,
        bir_status: birResult.status,
      };
    }

    // Step 3: Combine the data
    const combinedData = {
      ...projectData,
      designer_assignment: assignmentData?.designer || null,
      ...birData, // Add bir_id and bir_status, will be null if not found
    };

    return NextResponse.json(combinedData);
  } catch (error: any) {
    console.error('Unexpected error in GET handler:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch project details due to server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/admin/projects/web_design/{projectId}:
 *   put:
 *     summary: Update a web design project (Admin)
 *     description: Updates fields for a specific web design project. Requires admin privileges. Validates status against allowed values.
 *     tags: [Admin Projects]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the web design project to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in_progress, completed, on_hold, cancelled] }
 *               deadline: { type: string, format: date-time, nullable: true }
 *               # Add other updatable fields for web_design_projects
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 project: { type: object } # Updated project object
 *       400:
 *         description: Bad request (e.g., invalid status value).
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Admin access required.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Server error.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { authorized, error: authError } = await verifyAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const { projectId } = params;
    const dataToUpdate = await request.json();

    // --- Status Validation Start ---
    const allowedStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
    if (dataToUpdate.hasOwnProperty('status')) { // Check if status is being updated
      if (!allowedStatuses.includes(dataToUpdate.status)) {
        console.error(`Invalid status value received: ${dataToUpdate.status}`);
        return NextResponse.json(
          { error: `Invalid status value '${dataToUpdate.status}'. Allowed values are: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }
    // --- Status Validation End ---

    // Remove projectId from data if it exists to avoid trying to update the primary key
    delete dataToUpdate.id;
    delete dataToUpdate.projectId;
    // Add updated_at timestamp
    dataToUpdate.updated_at = new Date().toISOString();

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('web_design_projects')
      .update(dataToUpdate)
      .eq('id', projectId)
      .select()
      .single(); // Use select().single() to get the updated record back

    if (error) {
      console.error('Error updating web_design_project:', error);
      // Database constraint error is now less likely due to above validation, but handle just in case
      if (error.message.includes('_status_check')) {
        return NextResponse.json(
          { error: `Database rejected status. Allowed values are: ${allowedStatuses.join(', ')}. Details: ${error.message}` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: `Failed to update project: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Web design project updated successfully!', project: data });

  } catch (error: any) {
    console.error('Unexpected error in PUT handler:', error);
    return NextResponse.json({ error: error.message || 'Failed to update project due to server error' }, { status: 500 });
  }
} 