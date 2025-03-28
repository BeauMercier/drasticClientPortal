import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type ProjectStage = 'discovery' | 'concept-development' | 'refinement' | 'finalization' | 'delivery';

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
    
    console.log('Admin Update Project Stage API: Starting request');
    
    // Parse the request body
    const body = await request.json();
    const { projectId, projectType, newStage } = body;
    
    if (!projectId || !projectType || !newStage) {
      console.error('Admin Update Project Stage API: Missing required fields');
      return NextResponse.json(
        { error: 'Project ID, project type and new stage are required' }, 
        { status: 400 }
      );
    }
    
    // Validate stage value
    const validStages: ProjectStage[] = ['discovery', 'concept-development', 'refinement', 'finalization', 'delivery'];
    if (!validStages.includes(newStage as ProjectStage)) {
      return NextResponse.json(
        { error: 'Invalid stage value. Must be one of: discovery, concept-development, refinement, finalization, delivery' }, 
        { status: 400 }
      );
    }
    
    // Map the project type to the correct table name
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
    
    try {
      console.log(`Admin Update Project Stage API: Updating ${projectType} project ${projectId} to stage ${newStage}`);
      
      // Use admin client
      const adminClient = createAdminClient();
      
      // Get the current date for the stage update
      const stageDate = new Date().toISOString();
      
      // Create update data with the appropriate stage date
      const updateData: Record<string, unknown> = {
        current_stage: newStage,
        updated_at: stageDate
      };
      
      // Add stage-specific date field
      switch (newStage) {
        case 'discovery':
          updateData.discovery_date = stageDate;
          updateData.status = 'pending';
          break;
        case 'concept-development': 
          updateData.concept_development_date = stageDate;
          updateData.status = 'in_progress';
          break;
        case 'refinement':
          updateData.refinement_date = stageDate;
          updateData.status = 'in_progress';
          break;
        case 'finalization':
          updateData.finalization_date = stageDate;
          updateData.status = 'in_progress';
          break;
        case 'delivery':
          updateData.delivery_date = stageDate;
          updateData.status = 'completed';
          break;
      }
      
      // Update the project directly in the specific table
      const { data, error } = await adminClient
        .from(tableName)
        .update(updateData)
        .eq('id', projectId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Admin Update Project Stage API: Error updating stage:', error);
        return NextResponse.json(
          { error: `Error updating project stage: ${error.message}` }, 
          { status: 500 }
        );
      }
      
      // Optional: Send notification about stage change
      try {
        await sendStageChangeNotification(adminClient, projectId, projectType, newStage);
      } catch (notifyError) {
        console.error('Admin Update Project Stage API: Error sending notification:', notifyError);
        // Continue without failing the entire operation
      }
      
      console.log('Admin Update Project Stage API: Update successful');
      return NextResponse.json({
        success: true,
        message: 'Project stage updated successfully',
        project: data
      });
    } catch (err) {
      console.error('Admin Update Project Stage API: Error updating stage:', err);
      return NextResponse.json(
        { error: `Error updating project stage: ${err instanceof Error ? err.message : String(err)}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin Update Project Stage API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
}

/**
 * Send a notification about the stage change
 * This would typically integrate with your notification system
 */
async function sendStageChangeNotification(
  supabase: SupabaseClient,
  projectId: string,
  projectType: string,
  newStage: string
) {
  // Get project information
  const { data: project, error: projectError } = await supabase
    .from(projectType === 'web_design' ? 'web_design_projects' : 
          projectType === 'logo_design' ? 'logo_design_projects' : 
          'social_graphics_projects')
    .select('title, user_id')
    .eq('id', projectId)
    .single();
  
  if (projectError || !project) {
    console.error('Failed to get project for notification:', projectError);
    return;
  }
  
  // Get user information (project owner)
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', project.user_id)
    .single();
  
  if (userError || !user) {
    console.error('Failed to get user for notification:', userError);
    return;
  }
  
  // Format stage for display
  const formattedStage = newStage
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Log the notification (in a real system, you would send an email or in-app notification)
  console.log(`NOTIFICATION: Project "${project.title}" has moved to the ${formattedStage} stage.`);
  console.log(`Would notify user ${user.full_name} (${user.email}) about this update.`);
  
  // Insert a record in the notifications table (if you have one)
  // This is just an example - adjust according to your actual schema
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: project.user_id,
        title: `Project Stage Update: ${formattedStage}`,
        message: `Your project "${project.title}" has moved to the ${formattedStage} stage.`,
        type: 'project_update',
        read: false,
        related_id: projectId,
        related_type: projectType
      });
      
    if (notificationError) {
      console.error('Failed to create notification record:', notificationError);
    }
  } catch (err) {
    console.error('Error saving notification:', err);
    // Silently fail - notification is non-critical
  }
} 