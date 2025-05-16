import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { SupabaseClient } from '@supabase/supabase-js';

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
    
    console.log('Admin Force Create Project API: Starting request');
    
    // Parse the request body
    const body = await request.json();
    const { 
      projectType, 
      userId, 
      projectData, 
      confirmationCode,
      skipValidation = false
    } = body;
    
    // Validate required parameters
    if (!projectType || !userId || !projectData) {
      console.error('Admin Force Create Project API: Missing required fields');
      return NextResponse.json(
        { error: 'Project type, user ID, and project data are required' }, 
        { status: 400 }
      );
    }
    
    // Safety check: require confirmation code to prevent accidental creation
    if (confirmationCode !== 'FORCE_CREATE_CONFIRMED') {
      console.error('Admin Force Create Project API: Invalid confirmation code');
      return NextResponse.json(
        { error: 'Operation requires valid confirmation code for safety' }, 
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
    
    // Use admin client
    const adminClient = createAdminClient();
    
    // First verify the user exists
    if (!skipValidation) {
      const { data: user, error: userError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (userError || !user) {
        console.error('Admin Force Create Project API: User not found:', userError);
        return NextResponse.json(
          { error: 'User not found. Use skipValidation=true to override this check.' }, 
          { status: 400 }
        );
      }
    }
    
    try {
      // Prepare the project data
      const now = new Date().toISOString();
      const projectInsertData = {
        ...projectData,
        user_id: userId,
        created_at: now,
        updated_at: now,
        active: true,
        // Set default status and stage if not provided
        status: projectData.status || 'pending',
        current_stage: projectData.current_stage || 'uninitialized',
        stage: projectData.stage || 'intake'
      };
      
      // Create the project
      const { data: newProject, error } = await adminClient
        .from(tableName)
        .insert(projectInsertData)
        .select('*')
        .single();
      
      if (error) {
        console.error(`Admin Force Create Project API: Error creating project in ${tableName}:`, error);
        return NextResponse.json(
          { error: `Error creating project: ${error.message}` }, 
          { status: 500 }
        );
      }
      
      // Send notification to the user
      try {
        await sendProjectCreationNotification(adminClient, userId, projectType, newProject.title || 'New project');
      } catch (notifyError) {
        console.error('Admin Force Create Project API: Error sending notification:', notifyError);
        // Continue without failing the operation
      }
      
      console.log(`Admin Force Create Project API: Successfully created project in ${tableName}`);
      return NextResponse.json({
        success: true,
        message: `Successfully created ${projectType} project for user`,
        project: { ...newProject, type: projectType }
      });
    } catch (err) {
      console.error('Admin Force Create Project API: Error creating project:', err);
      return NextResponse.json(
        { error: `Error creating project: ${err instanceof Error ? err.message : String(err)}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin Force Create Project API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
}

/**
 * Send notification about project creation to the user
 */
async function sendProjectCreationNotification(
  supabase: SupabaseClient,
  userId: string,
  projectType: string,
  projectTitle: string
) {
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'New Project Created',
        message: `A new ${projectType.replace('_', ' ')} project "${projectTitle}" has been created for your account.`,
        type: 'project_created',
        read: false,
        created_at: new Date().toISOString()
      });
      
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }
  } catch (err) {
    console.error('Error sending notification:', err);
    // Silently fail - notification is non-critical
  }
} 