import { NextRequest, NextResponse } from 'next/server';
import { initDriveClient, findClientFolder } from '@/lib/google-drive/driveClient';
import { auth } from '@/lib/auth/auth.config';

// Helper to format file size
function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Helper to format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get folder ID from query parameters
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const clientEmail = session.user.email;
    
    // Initialize the Google Drive client
    const drive = initDriveClient();
    
    // Determine which folder to use
    let targetFolderId = folderId;
    
    if (!targetFolderId && clientEmail) {
      // Find the folder by client email
      const clientFolder = await findClientFolder(drive, clientEmail);
      
      if (!clientFolder) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No folder found for this client',
            files: [] 
          },
          { status: 404 }
        );
      }
      
      targetFolderId = clientFolder.id;
    }
    
    if (!targetFolderId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No folder ID provided and could not determine folder by email',
          files: [] 
        },
        { status: 400 }
      );
    }

    // Fetch files from the folder
    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.data.files || [];
    
    // Process file data for frontend use
    const processedFiles = files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: formatFileSize(Number(file.size)),
      modifiedTime: formatDate(file.modifiedTime),
      webViewLink: file.webViewLink,
      iconLink: file.iconLink,
      thumbnailLink: file.thumbnailLink,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder'
    }));

    return NextResponse.json({
      success: true,
      fileCount: files.length,
      files: processedFiles,
      error: null
    });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to fetch files: ${error.message}`,
        files: [] 
      },
      { status: 500 }
    );
  }
} 