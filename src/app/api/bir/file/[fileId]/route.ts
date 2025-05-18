import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';   // cookie-aware client
import { supabaseServer } from '@/lib/supabaseServer';      // service-role client

export async function DELETE(
  req: Request, // req is available but not directly passed to createApiClient as it uses next/headers
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 });
  }

  /* --------------------------------------------------  
   * 1.  Get the current user session (via cookies)
   * -------------------------------------------------*/
  const userClient = createApiClient(); // Corrected: createApiClient doesn't take req directly here
  const { data: { session } } = await userClient.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  /* --------------------------------------------------  
   * 2.  Use the service-role client for privileged ops
   * -------------------------------------------------*/
  const serviceClient = supabaseServer();

  // Fetch the bir_file row
  const { data: fileRow, error: fileErr } = await serviceClient
    .from('bir_file')
    .select('id, bir_id, storage_path')
    .eq('id', fileId)
    .single();

  if (fileErr || !fileRow) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Fetch the parent BIR to check ownership
  const { data: birRow, error: birErr } = await serviceClient
    .from('business_information_requests')
    .select('id, client_id')
    .eq('id', fileRow.bir_id)
    .single();

  if (birErr || !birRow) {
    return NextResponse.json({ error: 'Parent BIR not found' }, { status: 404 });
  }

  const userRole = session.user.app_metadata?.role;
  const isAdmin  = userRole === 'admin';
  const isOwner  = session.user.id === birRow.client_id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  /* --------------------------------------------------  
   * 3.  Remove object from storage (ignore 404)
   * -------------------------------------------------*/
  const { error: storageErr } = await serviceClient
    .storage
    .from('bir-files')
    .remove([fileRow.storage_path]);

  if (
    storageErr &&
    storageErr.message !== 'The resource was not found' &&
    storageErr.message !== 'The specified key does not exist.' // Added by previous logic, keeping it
  ) {
    console.error('Supabase storage remove error:', storageErr);
    return NextResponse.json(
      { error: 'Failed to delete file from storage' },
      { status: 500 }
    );
  }

  /* --------------------------------------------------  
   * 4.  Delete the DB row
   * -------------------------------------------------*/
  const { error: dbErr } = await serviceClient
    .from('bir_file')
    .delete()
    .eq('id', fileId);

  if (dbErr) {
    console.error('Supabase DB delete error:', dbErr);
    return NextResponse.json(
      { error: 'Failed to delete DB record' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
} 