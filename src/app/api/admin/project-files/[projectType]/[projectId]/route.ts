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
  const { authorized, error: authError } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ message: authError || 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { projectId } = params;

  // 1. Get the bir_id and client_id directly from business_information_requests
  const { data: birRecord, error: birError } = await supabase
    .from('business_information_requests')
    .select('id, client_id') // Select bir_id (as id) and client_id
    .eq('project_id', projectId)
    .maybeSingle();

  if (birError) {
    // This console.error will now show the actual error if this query fails
    console.error('Error fetching BIR record for project_id:', projectId, birError);
    return NextResponse.json({ message: 'Error fetching business information for project.' }, { status: 500 });
  }

  if (!birRecord) {
    return NextResponse.json([]); // No BIR, so no BIR files
  }

  const birId = birRecord.id;
  const clientId = birRecord.client_id;

  // 2. If we have a client_id, fetch their profile to use as uploader
  let uploaderProfile: { id: string; full_name: string | null; email: string | null } | null = null;
  if (clientId) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', clientId)
      .single();
    if (profileError) {
      console.warn('Error fetching uploader profile for client_id:', clientId, profileError);
      // Continue without uploader info if profile fetch fails, or handle more strictly
    } else {
      uploaderProfile = profile;
    }
  }

  // 3. Fetch files from bir_file associated with the birId
  const { data: filesData, error: fileErr } = await supabase
    .from('bir_file')
    .select(
      'id, storage_path, mime_type, uploaded_at, original_name, size_bytes'
    )
    .eq('bir_id', birId)
    .order('uploaded_at', { ascending: false });

  if (fileErr) {
    console.error('Admin project-files (bir_file) fetch error:', fileErr);
    return NextResponse.json({ message: fileErr.message }, { status: 500 });
  }

  const ONE_HOUR = 60 * 60;

  // 4. Map to the expected AdminProjectFile structure and generate signed URLs
  const responseDataPromises = filesData ? filesData.map(async (file) => {
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('bir-files') // Explicitly use 'bir-files' bucket
      .createSignedUrl(file.storage_path, ONE_HOUR);

    if (signedUrlError) {
      console.error(`Error generating signed URL for ${file.storage_path}:`, signedUrlError);
      // Decide how to handle: return file without URL, or skip, or error out?
      // For now, returning without download_url or with null.
      return {
        id: file.id,
        storage_path: file.storage_path,
        mime_type: file.mime_type,
        created_at: file.uploaded_at,
        uploader: uploaderProfile,
        original_name: file.original_name,
        size_bytes: file.size_bytes,
        download_url: null, // Or some error indicator
      };
    }
    
    return {
      id: file.id,
      storage_path: file.storage_path,
      mime_type: file.mime_type,
      created_at: file.uploaded_at,
      uploader: uploaderProfile,
      original_name: file.original_name,
      size_bytes: file.size_bytes,
      download_url: signedUrlData?.signedUrl,
    };
  }) : [];
  
  const responseData = await Promise.all(responseDataPromises);

  return NextResponse.json(responseData);
} 