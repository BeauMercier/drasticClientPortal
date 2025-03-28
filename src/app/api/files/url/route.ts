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
    
    const { data, error } = await serviceClient
      .storage
      .from(FILES_BUCKET)
      .createSignedUrl(filePath, 60, options);

    if (error) {
      console.error('Error creating signed URL:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Error generating file URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate file URL' },
      { status: 500 }
    );
  }
} 