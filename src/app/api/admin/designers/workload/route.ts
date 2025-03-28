import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

// Create a Supabase Admin client with service role that bypasses RLS
function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    throw new Error('Service role key is required for admin operations');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Helper function to verify admin access
async function verifyAdminAccess() {
  try {
    // Create a Supabase client configured to use cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the user using getUser() for better security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
    
    // Get the user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { authorized: false, error: 'Failed to get user profile' };
    }
    
    // Check if user is an admin
    if (profile.role !== 'admin') {
      return { authorized: false, error: 'Unauthorized: Admin access required' };
    }
    
    return { authorized: true, user };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: false, error: 'Server error during authorization' };
  }
}

/**
 * GET endpoint to fetch designer workloads with project counts
 */
export async function GET() {
  try {
    console.log('Admin Designer Workload API: Starting request');
    
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Initialize Supabase client with service role key
    const supabase = createServiceRoleClient();
    
    // Fetch all designers
    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('role', 'designer');
      
    if (designersError) {
      console.error('Admin Designer Workload API: Error fetching designers:', designersError);
      return NextResponse.json(
        { error: `Error fetching designers: ${designersError.message}` }, 
        { status: 500 }
      );
    }
    
    // Fetch active projects with designer assignments
    const { data: designerProjects, error: projectsError } = await supabase
      .from('project_assignments')
      .select(`
        id,
        designer_id,
        project_id,
        project_type,
        assigned_at
      `)
      .order('assigned_at', { ascending: false });
      
    if (projectsError) {
      console.error('Admin Designer Workload API: Error fetching designer projects:', projectsError);
      return NextResponse.json(
        { error: `Error fetching designer projects: ${projectsError.message}` }, 
        { status: 500 }
      );
    }

    console.log(`Admin Designer Workload API: Found ${designerProjects?.length || 0} project assignments`);
      
    // Fetch projects to check status
    const { data: webProjects, error: webError } = await supabase
      .from('web_design_projects')
      .select('id, status, name');
      
    const { data: logoProjects, error: logoError } = await supabase
      .from('logo_design_projects')
      .select('id, status, name');
      
    const { data: socialProjects, error: socialError } = await supabase
      .from('social_graphics_projects')
      .select('id, status, name');
      
    if (webError || logoError || socialError) {
      console.error('Admin Designer Workload API: Error fetching projects:', { webError, logoError, socialError });
      // Continue anyway and use what we have
    }

    console.log(`Admin Designer Workload API: Found ${webProjects?.length || 0} web projects, ${logoProjects?.length || 0} logo projects, ${socialProjects?.length || 0} social projects`);
    
    // Combine all projects into a single map for quick lookup
    const allProjects = new Map();
    
    webProjects?.forEach(project => {
      const key = `web_design:${project.id}`;
      allProjects.set(key, { 
        type: 'web_design',
        name: project.name,
        status: project.status 
      });
      // Also set by just ID for fallback lookup
      allProjects.set(project.id.toString(), { 
        type: 'web_design',
        name: project.name,
        status: project.status 
      });
      console.log(`Added web project to map with key: ${key}, status: ${project.status}`);
    });
    
    logoProjects?.forEach(project => {
      const key = `logo_design:${project.id}`;
      allProjects.set(key, { 
        type: 'logo_design',
        name: project.name,
        status: project.status 
      });
      // Also set by just ID for fallback lookup
      allProjects.set(project.id.toString(), { 
        type: 'logo_design',
        name: project.name,
        status: project.status 
      });
      console.log(`Added logo project to map with key: ${key}, status: ${project.status}`);
    });
    
    socialProjects?.forEach(project => {
      const key = `social_graphics:${project.id}`;
      allProjects.set(key, { 
        type: 'social_graphics',
        name: project.name,
        status: project.status 
      });
      // Also set by just ID for fallback lookup
      allProjects.set(project.id.toString(), { 
        type: 'social_graphics',
        name: project.name,
        status: project.status 
      });
      console.log(`Added social project to map with key: ${key}, status: ${project.status}`);
    });

    console.log(`Admin Designer Workload API: Created map with ${allProjects.size} total projects`);
    
    // Log a sample of keys in the map to verify format
    console.log('Sample of project map keys:', Array.from(allProjects.keys()).slice(0, 3));
    
    // Calculate workload for each designer
    const designerWorkloads = designers.map(designer => {
      // Get assignments for this designer
      const assignments = designerProjects.filter(
        dp => dp.designer_id === designer.id
      );
      
      console.log(`Admin Designer Workload API: Designer ${designer.full_name || designer.id} has ${assignments.length} assignments`);
      
      // Log the exact details of the assignments for this designer
      if (assignments.length > 0) {
        console.log('Designer assignments details:', 
          assignments.map(a => ({
            id: a.id,
            project_id: a.project_id,
            project_type: a.project_type,
            lookup_key: `${a.project_type}:${a.project_id}`
          }))
        );
      }
      
      // Group active projects by type
      const activeProjects = assignments
        .filter(assignment => {
          // Normalize project type to ensure consistent lookup
          let normalizedType = assignment.project_type.trim().toLowerCase();
          
          // Map common variations to standardized types
          if (normalizedType === 'web' || normalizedType === 'website') normalizedType = 'web_design';
          if (normalizedType === 'logo') normalizedType = 'logo_design';
          if (normalizedType === 'social' || normalizedType === 'social_media') normalizedType = 'social_graphics';
          
          // Create multiple possible keys for lookup
          const possibleKeys = [
            `${assignment.project_type}:${assignment.project_id}`,
            `${normalizedType}:${assignment.project_id}`,
            // Try without the colon format
            assignment.project_id.toString()
          ];
          
          // Try each key
          let project = null;
          for (const key of possibleKeys) {
            project = allProjects.get(key);
            if (project) {
              console.log(`Found project with key: ${key}, status: ${project.status}`);
              break;
            }
          }
          
          // If still not found, try brute force approach
          if (!project) {
            console.log(`Project not found for assignment ${assignment.id}. Trying brute force lookup...`);
            console.log(`Tried keys: ${possibleKeys.join(', ')}`);
            
            // Try to find any key containing the project ID
            const allKeys = Array.from(allProjects.keys());
            const matchingKey = allKeys.find(key => key.includes(assignment.project_id.toString()));
            
            if (matchingKey) {
              console.log(`Found partial match with key: ${matchingKey}`);
              project = allProjects.get(matchingKey);
            } else {
              // Last resort: try to search by ID without any prefix
              for (const key of allKeys) {
                if (key.endsWith(`:${assignment.project_id}`) || key === assignment.project_id.toString()) {
                  console.log(`Found by ID match with key: ${key}`);
                  project = allProjects.get(key);
                  break;
                }
              }
            }
          }
          
          // Debug logging for project status checking
          if (project) {
            console.log(`Assignment ${assignment.id} - Project found with status: ${project.status}`);
            
            // Accept ANY status that could indicate active work
            // Different parts of the app might use different terminology
            const activeStatuses = ['active', 'in_progress', 'in progress', 'ongoing', 'started'];
            const isActive = activeStatuses.includes(project.status?.toLowerCase());
            
            if (!isActive) {
              console.log(`Project ${assignment.project_id} has non-active status: ${project.status}`);
            }
            
            return isActive;
          } else {
            console.log(`Assignment ${assignment.id} - Project not found after all lookup attempts!`);
            
            // If we can't find the project, let's assume it's active for now
            // This ensures designers at least see their assignments even if status can't be verified
            return true;
          }
        })
        .map(assignment => {
          const projectKey = `${assignment.project_type}:${assignment.project_id}`;
          const project = allProjects.get(projectKey);
          return {
            id: assignment.project_id,
            type: assignment.project_type,
            name: project?.name || 'Unknown Project',
            assignedAt: assignment.assigned_at
          };
        });
      
      // Count projects by type
      const projectTypeCount = {
        web_design: 0,
        logo_design: 0,
        social_graphics: 0
      };
      
      activeProjects.forEach(project => {
        if (project.type in projectTypeCount) {
          projectTypeCount[project.type as keyof typeof projectTypeCount]++;
        }
      });
      
      // Calculate workload level (0-100%)
      // Assuming a designer can handle up to 10 active projects at once
      const maxProjectsPerDesigner = 10;
      const workloadPercentage = Math.min(
        100,
        Math.round((activeProjects.length / maxProjectsPerDesigner) * 100)
      );
      
      return {
        id: designer.id,
        name: designer.full_name || designer.email || 'Unknown Designer',
        email: designer.email,
        avatar_url: designer.avatar_url,
        activeProjects: activeProjects,
        totalActiveProjects: activeProjects.length,
        projectTypes: projectTypeCount,
        workloadPercentage,
        workloadLevel: workloadPercentage < 40 ? 'low' : workloadPercentage < 75 ? 'medium' : 'high'
      };
    });
    
    // Sort designers by workload (most busy first)
    designerWorkloads.sort((a, b) => b.totalActiveProjects - a.totalActiveProjects);
    
    return NextResponse.json(designerWorkloads);
  } catch (error) {
    console.error('Admin Designer Workload API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? (error as Error).message : String(error)) }, 
      { status: 500 }
    );
  }
} 