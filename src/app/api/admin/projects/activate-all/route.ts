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
    
    console.log('Admin Activate All Projects API: Starting request');
    
    // Parse the request body
    const body = await request.json();
    const { projectType, confirmationCode, clientId } = body;
    
    // Validate required parameters
    if (!projectType) {
      console.error('Admin Activate All Projects API: Missing project type');
      return NextResponse.json(
        { error: 'Project type is required' }, 
        { status: 400 }
      );
    }
    
    // Safety check: require confirmation code to prevent accidental activation
    if (confirmationCode !== 'ACTIVATE_ALL_CONFIRMED') {
      console.error('Admin Activate All Projects API: Invalid confirmation code');
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
    
    try {
      // Build the query
      let query = adminClient
        .from(tableName)
        .update({ 
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('active', false);
      
      // Add optional client filter if provided
      if (clientId) {
        query = query.eq('user_id', clientId);
      }
      
      // Execute the query
      const { error, count } = await query;
      
      if (error) {
        console.error(`Admin Activate All Projects API: Error updating ${tableName}:`, error);
        return NextResponse.json(
          { error: `Error activating projects: ${error.message}` }, 
          { status: 500 }
        );
      }
      
      // Attempt to send batch notifications
      try {
        await sendBatchNotifications(adminClient, tableName, clientId);
      } catch (notifyError) {
        console.error('Admin Activate All Projects API: Error sending notifications:', notifyError);
        // Continue without failing the operation
      }
      
      console.log(`Admin Activate All Projects API: Successfully activated projects in ${tableName}`);
      return NextResponse.json({
        success: true,
        message: `Successfully activated all inactive ${projectType} projects${clientId ? ' for the specified client' : ''}`,
        count: count
      });
    } catch (err) {
      console.error('Admin Activate All Projects API: Error activating projects:', err);
      return NextResponse.json(
        { error: `Error activating projects: ${err instanceof Error ? err.message : String(err)}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin Activate All Projects API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
}

/**
 * Send batch notifications to affected users
 */
async function sendBatchNotifications(
  supabase: SupabaseClient,
  tableName: string,
  clientId?: string
) {
  // Get list of affected users (if many projects were updated)
  const query = supabase
    .from(tableName)
    .select('user_id, title')
    .eq('active', true);
  
  // Apply client filter if provided
  if (clientId) {
    query.eq('user_id', clientId);
  }
  
  // Get recently activated projects
  const { data: projects, error } = await query;
  
  if (error || !projects || projects.length === 0) {
    console.log('No projects found for notifications');
    return;
  }
  
  // Group projects by user for efficient notification
  const userProjects: Record<string, { count: number, titles: string[] }> = {};
  
  for (const project of projects) {
    if (!userProjects[project.user_id]) {
      userProjects[project.user_id] = { count: 0, titles: [] };
    }
    userProjects[project.user_id].count += 1;
    if (userProjects[project.user_id].titles.length < 3) { // Only store first 3 for the message
      userProjects[project.user_id].titles.push(project.title);
    }
  }
  
  // Send notifications to each affected user
  const notifications = Object.entries(userProjects).map(([userId, data]) => {
    let message = `${data.count} of your projects have been activated`;
    if (data.count <= 3) {
      message = `Your project${data.count > 1 ? 's' : ''} ${data.titles.join(', ')} ${data.count > 1 ? 'have' : 'has'} been activated.`;
    } else {
      message = `${data.count} of your projects including ${data.titles.join(', ')} and others have been activated.`;
    }
    
    return {
      user_id: userId,
      title: 'Projects Activated',
      message: message,
      type: 'bulk_update',
      read: false,
      created_at: new Date().toISOString()
    };
  });
  
  if (notifications.length > 0) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);
      
    if (notificationError) {
      console.error('Failed to create batch notifications:', notificationError);
    }
  }
} 