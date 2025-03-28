import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api/server';
import { requireAuth } from '@/lib/api/server-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 * 
 * Retrieves dashboard statistics for admin users
 */
export async function GET() {
  try {
    // Verify admin access
    const authResult = await requireAuth();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Create admin client
    const supabase = createAdminClient();
    
    // Get user's profile to verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.user.id)
      .single();
      
    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get dashboard statistics
    
    // Count active projects by type
    const { data: projectStats, error: projectError } = await supabase
      .from('projects')
      .select('project_type, is_active')
      .eq('is_active', true);
      
    if (projectError) {
      return NextResponse.json(
        { error: 'Failed to retrieve project statistics' },
        { status: 500 }
      );
    }
    
    // Count users by role
    const { data: userStats, error: userError } = await supabase
      .from('profiles')
      .select('role');
      
    if (userError) {
      return NextResponse.json(
        { error: 'Failed to retrieve user statistics' },
        { status: 500 }
      );
    }
    
    // Process project stats
    const projectCounts: Record<string, number> = {};
    projectStats.forEach(project => {
      const type = project.project_type as string;
      projectCounts[type] = (projectCounts[type] || 0) + 1;
    });
    
    // Process user stats
    const userCounts: Record<string, number> = {};
    userStats.forEach(user => {
      const role = user.role as string;
      userCounts[role] = (userCounts[role] || 0) + 1;
    });
    
    // Return dashboard data
    return NextResponse.json({
      projects: {
        total: projectStats.length,
        byType: projectCounts
      },
      users: {
        total: userStats.length,
        byRole: userCounts
      }
    });
  } catch (error) {
    console.error('Error retrieving admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    );
  }
} 