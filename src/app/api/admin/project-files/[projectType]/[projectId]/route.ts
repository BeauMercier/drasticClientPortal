import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api/server';
import { createApiClient } from '@/lib/api/server-utils';

// Helper to verify admin access
async function verifyAdminAccess() {
  try {
    const supabase = createAdminClient(); // Use admin client for robust auth
    const { data: { user }, error: userError } = await createApiClient().auth.getUser(); // Still need user from request context

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
  // ================= CHECK 1: Environment Configuration =================
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
    return NextResponse.json({ message: 'Server configuration error: Missing required environment variable.' }, { status: 500 });
  }

  const { authorized, error: authError } = await verifyAdminAccess();
  if (!authorized) {
    return NextResponse.json({ message: authError || 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { projectId } = params;

  // ================= CHECK 2: Fetching the BIR Record =================
  console.log(`[CHECK 2] Fetching BIR record for project_id: ${projectId}`);
  const { data: birRecord, error: birError } = await supabase
    .from('business_information_requests')
    .select('id, client_id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (birError) {
    console.error(`[FAIL] Database error fetching BIR record for project_id ${projectId}:`, birError);
    return NextResponse.json({ message: 'Error fetching business information for project.' }, { status: 500 });
  }

  if (!birRecord) {
    console.log(`[INFO] No BIR record found for project_id: ${projectId}. Returning empty file list.`);
    return NextResponse.json([]); // No BIR, so no BIR files. This is expected if BIR isn't submitted.
  }

  console.log(`[PASS] Found BIR record. ID: ${birRecord.id}, Client ID: ${birRecord.client_id}`);
  const birId = birRecord.id;
  const clientId = birRecord.client_id;

  // If we have a client_id, fetch their profile to use as uploader
  let uploaderProfile: { id: string; full_name: string | null; email: string | null } | null = null;
  if (clientId) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', clientId)
      .single();
    if (profileError) {
      console.warn('Could not fetch uploader profile for client_id:', clientId, profileError);
    } else {
      uploaderProfile = profile;
    }
  }

  // ================= CHECK 3: Fetching the Associated Files =================
  console.log(`[CHECK 3] Fetching files from 'bir_file' where bir_id = ${birId}`);
  const { data: filesData, error: fileErr } = await supabase
    .from('bir_file')
    .select('id, storage_path, mime_type, uploaded_at, original_name, size_bytes')
    .eq('bir_id', birId)
    .order('uploaded_at', { ascending: false });

  if (fileErr) {
    console.error(`[FAIL] Database error fetching files from 'bir_file' for bir_id ${birId}:`, fileErr);
    return NextResponse.json({ message: fileErr.message }, { status: 500 });
  }

  if (!filesData || filesData.length === 0) {
    console.log(`[INFO] Found 0 files in 'bir_file' for bir_id: ${birId}. Returning empty file list.`);
    return NextResponse.json([]);
  }

  console.log(`[PASS] Found ${filesData.length} file(s) for bir_id ${birId}.`);
  const ONE_HOUR = 60 * 60;

  // Map to the expected AdminProjectFile structure and generate signed URLs
  const responseDataPromises = filesData.map(async (file) => {
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('bir-files')
      .createSignedUrl(file.storage_path, ONE_HOUR);

    if (signedUrlError) {
      console.error(`Error generating signed URL for ${file.storage_path}:`, signedUrlError);
      return {
        id: file.id,
        storage_path: file.storage_path,
        mime_type: file.mime_type,
        created_at: file.uploaded_at,
        uploader: uploaderProfile,
        original_name: file.original_name,
        size_bytes: file.size_bytes,
        download_url: null,
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
  });
  
  const responseData = await Promise.all(responseDataPromises);

  console.log(`[SUCCESS] Returning ${responseData.length} file(s) to the client.`);
  return NextResponse.json(responseData);
} 