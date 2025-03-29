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
    // Explicitly cast type to ProjectType or null
    const type = searchParams.get('type') as ProjectType | null;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const adminClient = createAdminClient();
    
    let queryResponse: PostgrestResponse<AdminProjectListItem>;
    const selectQuery = '*, profiles:user_id(full_name)';

    // Use switch to handle different project types and apply correct typing
    switch (type) {
      case 'logo_design':
        let logoQuery = adminClient
          .from('logo_design_projects')
          .select(selectQuery);
        if (status) logoQuery = logoQuery.eq('status', status);
        if (userId) logoQuery = logoQuery.eq('user_id', userId);
        queryResponse = await logoQuery as PostgrestResponse<AdminProjectListItem>; // Assert final type
        break;

      case 'social_graphics':
        let socialQuery = adminClient
          .from('social_graphics_projects')
          .select(selectQuery);
        if (status) socialQuery = socialQuery.eq('status', status);
        if (userId) socialQuery = socialQuery.eq('user_id', userId);
        queryResponse = await socialQuery as PostgrestResponse<AdminProjectListItem>; // Assert final type
        break;

      case 'web_design':
      default: // Default to web_design if type is null or unknown
        let webQuery = adminClient
          .from('web_design_projects')
          .select(selectQuery);
        if (status) webQuery = webQuery.eq('status', status);
        if (userId) webQuery = webQuery.eq('user_id', userId);
        queryResponse = await webQuery as PostgrestResponse<AdminProjectListItem>; // Assert final type
        break;
    }

    const { data, error: queryError } = queryResponse;

    if (queryError) {
      console.error('Error fetching projects:', queryError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Data should now be correctly typed as AdminProjectListItem[] | null
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin projects API:', error);
    return NextResponse.json({ error: 'Server error processing request' }, { status: 500 });
  }
} 