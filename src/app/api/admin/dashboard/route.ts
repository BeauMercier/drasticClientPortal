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
    
    // Define project types and tables
    const projectTables = [
      { type: 'logo_design', table: 'logo_design_projects' },
      { type: 'social_graphics', table: 'social_graphics_projects' },
      { type: 'web_design', table: 'web_design_projects' }
    ];
    
    const projectCounts: Record<string, number> = {};
    let totalActiveProjects = 0;
    let projectErrorOccurred = false;
    let projectErrorMessage = '';

    // Fetch counts for each project type
    for (const proj of projectTables) {
      try {
        const { count, error } = await supabase
          .from(proj.table)
          .select('id', { count: 'exact', head: true })
          .eq('active', true); // Assuming 'active' column exists in these tables
          
        if (error) {
          console.error(`Error fetching count for ${proj.table}:`, error);
          projectErrorOccurred = true;
          projectErrorMessage = `Failed to retrieve statistics for ${proj.type}`; // Store first error
          // Don't break, try to get counts for other types
          projectCounts[proj.type] = 0; // Default to 0 on error for this type
        } else {
          const currentCount = count || 0;
          projectCounts[proj.type] = currentCount;
          totalActiveProjects += currentCount;
        }
      } catch (loopError) {
         console.error(`Unexpected error fetching count for ${proj.table}:`, loopError);
         projectErrorOccurred = true;
         projectErrorMessage = `Unexpected error retrieving statistics for ${proj.type}`;
         projectCounts[proj.type] = 0;
      }
    }
      
    // If any project query failed, return an error
    if (projectErrorOccurred) {
      return NextResponse.json(
        { error: projectErrorMessage || 'Failed to retrieve project statistics' },
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
    
    // Process user stats
    const userCounts: Record<string, number> = {};
    userStats.forEach(user => {
      const role = user.role as string;
      userCounts[role] = (userCounts[role] || 0) + 1;
    });
    
    // Return dashboard data
    return NextResponse.json({
      projects: {
        total: totalActiveProjects,
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