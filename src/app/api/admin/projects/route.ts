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
    const selectQuery = 'id, user_id, title, description, status, deadline, created_at, updated_at, client:user_id (id, full_name, email, company)';

    let allProjects: (AdminProjectListItem & { type: ProjectType })[] = [];

    // Helper function to fetch and map data
    const fetchAndMap = async (
      tableName: string,
      projectType: ProjectType,
      client: SupabaseClient
    ): Promise<(AdminProjectListItem & { type: ProjectType })[]> => {
      let query = client
        .from(tableName)
        .select(selectQuery);
        
      if (status && status !== 'all') query = query.eq('status', status);
      if (userId) query = query.eq('user_id', userId);
      
      const { data, error } = await query as PostgrestResponse<AdminProjectListItem>;
      
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw new Error(`Failed to fetch ${tableName}`);
      }
      
      // Add the type to each project and ensure client is an object
      return (data || []).map(p => ({
        ...p,
        client: p.profiles, // Rename profiles to client for consistency
        type: projectType
      }));
    };

    if (type) {
      // Fetch only the specified type
      allProjects = await fetchAndMap(type === 'web_design' ? 'web_design_projects' :
                                     type === 'logo_design' ? 'logo_design_projects' :
                                     'social_graphics_projects', type, adminClient);
    } else {
      // Fetch all types if no specific type is requested
      const webPromise = fetchAndMap('web_design_projects', 'web_design', adminClient);
      const logoPromise = fetchAndMap('logo_design_projects', 'logo_design', adminClient);
      const socialPromise = fetchAndMap('social_graphics_projects', 'social_graphics', adminClient);
      
      const results = await Promise.all([webPromise, logoPromise, socialPromise]);
      allProjects = results.flat(); // Combine results from all types
    }
    
    // Sort projects by creation date, newest first
    // Handle potential null created_at dates by defaulting to epoch 0
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