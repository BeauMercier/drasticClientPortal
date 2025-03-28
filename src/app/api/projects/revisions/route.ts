import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const revisionId = searchParams.get('revisionId');

    if (!revisionId) {
      return NextResponse.json({ error: 'Revision ID is required' }, { status: 400 });
    }

    // Create API client for authentication
    const supabase = createApiClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the user's role to verify permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to verify user permissions' }, { status: 500 });
    }

    // Only designers or admins can delete revisions
    if (!['designer', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // First verify the user owns the revision (for designers)
    if (profile.role === 'designer') {
      const { data: revisionData, error: revisionError } = await supabase
        .from('project_revisions')
        .select('created_by')
        .eq('id', revisionId)
        .single();

      if (revisionError) {
        console.error('Error fetching revision:', revisionError);
        return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      }

      if (revisionData.created_by !== user.id) {
        return NextResponse.json({ error: 'You can only delete revisions you created' }, { status: 403 });
      }
    }

    // Delete the revision
    const { error } = await supabase
      .from('project_revisions')
      .delete()
      .eq('id', revisionId);

    if (error) {
      console.error('Error deleting revision:', error);
      return NextResponse.json({ error: 'Failed to delete revision' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Revision deleted successfully',
      revisionId
    });
  } catch (error) {
    console.error('Unexpected error in DELETE revision route:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET endpoint to fetch revisions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');
    const revisionId = searchParams.get('revisionId');

    // Create API client for authentication
    const supabase = createApiClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // If revisionId is provided, return a single revision
    if (revisionId) {
      const { data, error } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('id', revisionId)
        .single();

      if (error) {
        console.error('Error fetching revision:', error);
        return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // Otherwise, return revisions for a project
    if (!projectId || !projectType) {
      return NextResponse.json({ error: 'Project ID and type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('project_revisions')
      .select('*')
      .eq('project_id', projectId)
      .eq('project_type', projectType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revisions:', error);
      return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET revision route:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 