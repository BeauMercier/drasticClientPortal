import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';
import { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestResponse } from '@supabase/supabase-js';
import {
  ProjectType,
  WebDesignProject,
  LogoDesignProject,
  SocialGraphicsProject
} from '@/lib/types/project';

// Define a common structure for the response items, including joined profile name
type AdminProjectListItem = (
  WebDesignProject |
  LogoDesignProject |
  SocialGraphicsProject
) & { profiles: { full_name: string | null } | null };

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

export async function GET(request: NextRequest) {
  try {
    const { authorized, error: authError } = await verifyAdminAccess();
    if (!authorized) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ProjectType | null;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const adminClient = createAdminClient();
    const selectQuery = 'id, user_id, title, description, status, deadline, created_at, updated_at, type, client:user_id (id, full_name, email, company)';

    let allProjects: (AdminProjectListItem & { type: ProjectType })[] = [];

    // Helper function to fetch and map data
    const fetchAndMap = async (
      tableName: string,
      projectType: ProjectType,
      client: SupabaseClient
    ): Promise<(AdminProjectListItem & { type: ProjectType })[]> => {
      let query = client
        .from(tableName)
        .select(selectQuery.replace(", type", ""));
        
      if (status && status !== 'all') query = query.eq('status', status);
      if (userId) query = query.eq('user_id', userId);
      
      const { data, error } = await query as PostgrestResponse<any>; 
      
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw new Error(`Failed to fetch ${tableName}`);
      }
      
      return (data || []).map(dbRow => {
        const { name, ...restOfDbRow } = dbRow; 
        return {
          ...restOfDbRow,
          title: dbRow.title, 
          type: projectType
        };
      });
    };

    if (type) {
      allProjects = await fetchAndMap(type === 'web_design' ? 'web_design_projects' :
                                     type === 'logo_design' ? 'logo_design_projects' :
                                     'social_graphics_projects', type, adminClient);
    } else {
      const webPromise = fetchAndMap('web_design_projects', 'web_design', adminClient);
      const logoPromise = fetchAndMap('logo_design_projects', 'logo_design', adminClient);
      const socialPromise = fetchAndMap('social_graphics_projects', 'social_graphics', adminClient);
      
      const results = await Promise.all([webPromise, logoPromise, socialPromise]);
      allProjects = results.flat();
    }
    
    // --- Start: Fetch and map designer assignments ---
    if (allProjects.length > 0) {
      const projectIdentifiers = allProjects.map(p => ({ id: p.id, type: p.type }));
      
      // Construct .or() query string for Supabase
      // Example: "and(project_id.eq.UUID1,project_type.eq.web_design),and(project_id.eq.UUID2,project_type.eq.logo_design)"
      const assignmentQueryConditions = projectIdentifiers
        .map(pi => `and(project_id.eq.${pi.id},project_type.eq.${pi.type})`)
        .join(',');

      if (assignmentQueryConditions) {
        const { data: assignments, error: assignmentsError } = await adminClient
          .from('designer_projects')
          .select('project_id, project_type, designer_id')
          .or(assignmentQueryConditions);

        if (assignmentsError) {
          console.warn('Failed to fetch designer assignments, projects will be returned without them:', assignmentsError);
        } else if (assignments && assignments.length > 0) {
          const assignmentsMap = new Map<string, string>(); // Key: "projectId_projectType", Value: designer_id
          assignments.forEach(assign => {
            assignmentsMap.set(`${assign.project_id}_${assign.project_type}`, assign.designer_id);
          });

          allProjects = allProjects.map(project => ({
            ...project,
            designer_id: assignmentsMap.get(`${project.id}_${project.type}`) || null,
          }));
        } else {
           // No assignments found, ensure designer_id is null
          allProjects = allProjects.map(project => ({
            ...project,
            designer_id: null,
          }));
        }
      } else {
        // No valid project identifiers to query assignments, ensure designer_id is null
        allProjects = allProjects.map(project => ({
          ...project,
          designer_id: null,
        }));
      }
    } else {
       // No projects, nothing to do for assignments
    }
    // --- End: Fetch and map designer assignments ---
    
    allProjects.sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json(allProjects);

  } catch (error) {
    console.error('Error in admin projects API:', error);
    const message = error instanceof Error ? error.message : 'Server error processing request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 