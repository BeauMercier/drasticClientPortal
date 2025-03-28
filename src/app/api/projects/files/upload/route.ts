import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { FILES_BUCKET } from '@/lib/api/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authResult = await requireAuth();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const projectType = formData.get('projectType') as string;
    
    if (!file || !projectId || !projectType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create storage path based on project type and ID
    const path = `${projectType}/${projectId}/${file.name}`;
    
    // Upload file to Supabase storage
    const supabase = createApiClient();
    
    const { data, error } = await supabase
      .storage
      .from(FILES_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get the file URL
    const { data: urlData } = await supabase
      .storage
      .from(FILES_BUCKET)
      .getPublicUrl(path);
      
    // Return success with file data
    return NextResponse.json({
      path: data.path,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Error in file upload API:', error);
    return NextResponse.json(
      { error: 'Server error processing file upload' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 