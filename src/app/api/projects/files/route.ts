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
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const projectType = searchParams.get('projectType');
    
    if (!projectId || !projectType) {
      return NextResponse.json(
        { error: 'Missing project ID or type' },
        { status: 400 }
      );
    }
    
    // Get the authenticated client
    const supabase = createApiClient();
    
    // Create the correct path for storage listing
    const path = `${projectType}/${projectId}`;
    
    // List all files for this project
    const { data, error } = await supabase
      .storage
      .from(FILES_BUCKET)
      .list(path, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error('Error listing project files:', error);
      return NextResponse.json(
        { error: 'Failed to list project files' },
        { status: 500 }
      );
    }
    
    // Return the file list
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in project files endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Helper function to format file size
// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 Bytes';
  
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
  
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }

// Helper function to get MIME type from file extension
// function getMimeTypeFromExt(ext: string): string {
//   const mimeTypes: {[key: string]: string} = {
//     'jpg': 'image/jpeg',
//     'jpeg': 'image/jpeg',
//     'png': 'image/png',
//     'gif': 'image/gif',
//     'pdf': 'application/pdf',
//     'doc': 'application/msword',
//     'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'xls': 'application/vnd.ms-excel',
//     'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     'ppt': 'application/vnd.ms-powerpoint',
//     'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//     'txt': 'text/plain',
//     'zip': 'application/zip',
//     'mp4': 'video/mp4',
//     'mp3': 'audio/mpeg',
//     'wav': 'audio/wav',
//     'svg': 'image/svg+xml',
//     'ai': 'application/postscript',
//     'psd': 'application/photoshop',
//     'sketch': 'application/sketch'
//   };
  
//   return mimeTypes[ext] || 'application/octet-stream';
// } 