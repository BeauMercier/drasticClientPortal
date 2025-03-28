import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { FILES_BUCKET } from '@/lib/api/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await requireAuth();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get file path from URL
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file path parameter' },
        { status: 400 }
      );
    }
    
    // Create a signed URL for download
    const supabase = createApiClient();
    
    const { data, error } = await supabase
      .storage
      .from(FILES_BUCKET)
      .createSignedUrl(filePath, 60, {
        download: true
      });
      
    if (error) {
      console.error('Error creating download URL:', error);
      return NextResponse.json(
        { error: 'Failed to create download URL' },
        { status: 500 }
      );
    }
    
    // Return the signed URL
    return NextResponse.json({ 
      url: data.signedUrl,
      fileName: filePath.split('/').pop() 
    });
  } catch (error) {
    console.error('Error in file download API:', error);
    return NextResponse.json(
      { error: 'Server error processing download request' },
      { status: 500 }
    );
  }
} 