import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { ProjectStage, ProjectType, ActiveClientProject, ProjectStatus } from '@/lib/types/project';
import { Database } from '@/lib/database.types';
// import { createServiceRoleClient } from '@/lib/api/server'; // No longer needed for this version

export async function GET() {
  console.log('API: /api/client/active-projects invoked');
  const supabaseUserClient = createApiClient(); // User-context client for all operations
  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !user) {
    console.error('API: Error fetching user or user not authenticated:', authError);
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
  console.log('API: Authenticated user ID:', user.id);

  let allProjectsRaw: any[] = []; 
  let allProjectsMapped: ActiveClientProject[] = [];

  const projectTypeConfigs: { 
    type: ProjectType;
    tableName: keyof Database['public']['Tables'];
    titleField: string;
    // useServiceRole?: boolean; // Removed debug flag
  }[] = [
    { type: 'web_design', tableName: 'web_design_projects', titleField: 'title' }, 
    { type: 'logo_design', tableName: 'logo_design_projects', titleField: 'title' },
    { type: 'social_graphics', tableName: 'social_graphics_projects', titleField: 'title' },
  ];

  try {
    // const supabaseServiceRoleClient = createServiceRoleClient(); // No longer needed

    for (const config of projectTypeConfigs) {
      // const clientToUse = config.useServiceRole ? supabaseServiceRoleClient : supabaseUserClient;
      // const clientType = config.useServiceRole ? 'ServiceRoleClient' : 'UserClient';
      const clientToUse = supabaseUserClient; // Always use the user client now
      const clientType = 'UserClient';
      
      console.log(`API: Fetching ${config.type} projects from table ${String(config.tableName)} for user ${user.id} using ${clientType}, selecting title field: ${config.titleField}`);
      
      const { data: projects, error } = await clientToUse
        .from(config.tableName)
        .select(`id, ${config.titleField}, status, current_stage, discovery_date, concept_development_date, refinement_date, finalization_date, delivery_date`) 
        .eq('user_id', user.id);
      
      if (error) {
        console.error(`API: Error fetching ${config.type} projects using ${clientType}:`, error.message);
        continue;
      }

      if (projects && projects.length > 0) {
        console.log(`API: Fetched ${projects.length} raw ${config.type} projects using ${clientType}:`, JSON.stringify(projects, null, 2));
        allProjectsRaw.push(...projects);
        
        const typedProjects = projects.map((p: any) => ({
          id: p.id,
          title: p[config.titleField] || 'Untitled Project',
          project_type: config.type,
          status: p.status as ProjectStatus,
          current_stage: p.current_stage as ProjectStage | null,
          discovery_date: p.discovery_date,
          concept_development_date: p.concept_development_date,
          refinement_date: p.refinement_date,
          finalization_date: p.finalization_date,
          delivery_date: p.delivery_date,
          thumbnail_url: p.thumbnail_url || null,
        }));
        allProjectsMapped.push(...typedProjects);
      } else {
        console.log(`API: No ${config.type} projects found for user ${user.id} using ${clientType}.`);
      }
    }

    console.log('API: All projects fetched and mapped (before filtering by status):', JSON.stringify(allProjectsMapped, null, 2));

    const activeProjects = allProjectsMapped.filter(p => p.status === 'in_progress');
    console.log('API: Filtered active projects (status === "in_progress"):', JSON.stringify(activeProjects, null, 2));

    return NextResponse.json(activeProjects);

  } catch (e) {
    const error = e as Error;
    console.error('API: Unexpected error fetching active projects:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch active projects', details: error.message }, { status: 500 });
  }
} 