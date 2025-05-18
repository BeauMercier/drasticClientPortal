import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { ProjectStage, ProjectType, ActiveClientProject, ProjectStatus } from '@/lib/types/project';
import { Database } from '@/lib/database.types';
// import { createServiceRoleClient } from '@/lib/api/server'; // No longer needed for this version

export async function GET() {
  const supabaseUserClient = createApiClient(); // User-context client for all operations
  const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const allProjectsRaw: any[] = []; 
  const allProjectsMapped: ActiveClientProject[] = [];

  const projectTypeConfigs: { 
    type: ProjectType;
    tableName: keyof Database['public']['Tables'];
    titleField: string;
    clientRoute: string;
    // useServiceRole?: boolean; // Removed debug flag
  }[] = [
    { type: 'web_design', tableName: 'web_design_projects', titleField: 'title', clientRoute: 'web-design' }, 
    { type: 'logo_design', tableName: 'logo_design_projects', titleField: 'title', clientRoute: 'logo-design' },
    { type: 'social_graphics', tableName: 'social_graphics_projects', titleField: 'title', clientRoute: 'social-graphics' },
  ];

  try {
    // const supabaseServiceRoleClient = createServiceRoleClient(); // No longer needed

    for (const config of projectTypeConfigs) {
      // const clientToUse = config.useServiceRole ? supabaseServiceRoleClient : supabaseUserClient;
      // const clientType = config.useServiceRole ? 'ServiceRoleClient' : 'UserClient';
      const clientToUse = supabaseUserClient; // Always use the user client now
      
      const { data: projects, error } = await clientToUse
        .from(config.tableName)
        .select(`id, ${config.titleField}, status, current_stage, discovery_date, concept_development_date, refinement_date, finalization_date, delivery_date`) 
        .eq('user_id', user.id);
      
      if (error) {
        console.error(`API: Error fetching ${config.type} projects:`, error.message); // Keep this error log
        continue;
      }

      if (projects && projects.length > 0) {
        allProjectsRaw.push(...projects);
        
        const typedProjects = projects.map((p: any) => ({
          id: p.id,
          title: p[config.titleField] || 'Untitled Project',
          project_type: config.clientRoute,
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
        // Intentionally no log here if no projects are found, it's a valid state
      }
    }

    const activeProjects = allProjectsMapped.filter(p => p.status === 'in_progress');

    return NextResponse.json(activeProjects);

  } catch (e) {
    const error = e as Error;
    console.error('API: Unexpected error fetching active projects:', error.message, error.stack); // Keep this error log
    return NextResponse.json({ error: 'Failed to fetch active projects', details: error.message }, { status: 500 });
  }
} 