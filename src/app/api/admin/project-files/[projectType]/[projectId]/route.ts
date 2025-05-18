import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api/server';
import { createApiClient } from '@/lib/api/server-utils';

// Helper to verify admin access (copied from other admin routes for now)
async function verifyAdminAccess() {
  try {
    const supabase = createApiClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectType: string; projectId: string } }
) {
  const { authorized, error } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ message: error || 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { projectId } = params; // projectType is in params but not used by this DB query

  const { data, error: fileErr } = await supabase
    .from('project_files')
    .select(
      'id, storage_path, mime_type, created_at, uploader: uploader_id (id, full_name, email)'
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (fileErr) {
    console.error('Admin project-files fetch error', fileErr);
    return NextResponse.json({ message: fileErr.message }, { status: 500 });
  }

  return NextResponse.json(data);
} 