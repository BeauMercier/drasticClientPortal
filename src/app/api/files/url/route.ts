import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createServiceRoleClient } from '@/lib/api/server';
import { FILES_BUCKET } from '@/lib/api/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get file path from query
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    const forceDownload = url.searchParams.get('download') === 'true';

    console.log(`[API /files/url] Received request for filePath: ${filePath}`);

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file path parameter' },
        { status: 400 }
      );
    }

    // Get authenticated user from cookies using our consolidated API
    const supabaseClient = createApiClient();

    // Get session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get a signed URL for the file
    const serviceClient = createServiceRoleClient();
    
    // Set download option based on parameter
    const options = forceDownload ? { download: true } : undefined;
    
    console.log(`[API /files/url] Attempting to create signed URL for path: ${filePath} in bucket: ${FILES_BUCKET}`);
    
    const { data, error } = await serviceClient
      .storage
      .from(FILES_BUCKET)
      .createSignedUrl(filePath, 60, options);

    console.log('[API /files/url] Signed URL result:', { data, error });

    if (error) {
      console.error('Error creating signed URL:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || !data.signedUrl) {
       console.error('[API /files/url] createSignedUrl succeeded but data or signedUrl is missing', { data });
       throw new Error('Could not get file URL');
    }

    const responsePayload = { url: data.signedUrl };
    
    console.log('[API /files/url] Returning JSON payload:', responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error generating file URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate file URL' },
      { status: 500 }
    );
  }
} 