import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { FILES_BUCKET } from '@/lib/api/storage';

export const dynamic = 'force-dynamic';

// Delete a file from storage
export async function DELETE(request: NextRequest) {
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
    
    // Delete the file from storage
    const supabase = createApiClient();
    
    const { error } = await supabase
      .storage
      .from(FILES_BUCKET)
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in file delete API:', error);
    return NextResponse.json(
      { error: 'Server error processing delete request' },
      { status: 500 }
    );
  }
} 