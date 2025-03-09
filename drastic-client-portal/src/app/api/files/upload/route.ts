import { NextRequest, NextResponse } from 'next/server';
import { initDriveClient, findClientFolder } from '@/lib/google-drive/driveClient';
import { auth } from '@/lib/auth/auth.config';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientEmail = session.user.email;
    
    // Get form data
    const formData = await request.formData();
    
    // Get the uploaded file
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Get optional folder ID from form data
    const folderId = formData.get('folderId') as string;
    
    // Initialize the Google Drive client
    const drive = initDriveClient();
    
    // Determine parent folder ID
    let parentFolderId = folderId;
    
    if (!parentFolderId && clientEmail) {
      // Find folder by client email
      const clientFolder = await findClientFolder(drive, clientEmail);
      
      if (!clientFolder) {
        return NextResponse.json(
          { success: false, message: 'No folder found for this client' },
          { status: 404 }
        );
      }
      
      parentFolderId = clientFolder.id;
    }
    
    if (!parentFolderId) {
      return NextResponse.json(
        { success: false, message: 'Client email or folder ID is required' },
        { status: 400 }
      );
    }
    
    // Create file metadata
    const fileMetadata = {
      name: file.name,
      parents: [parentFolderId]
    };
    
    // Convert File to Buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Create a readable stream from the file buffer
    const stream = new Readable();
    stream.push(Buffer.from(fileBuffer));
    stream.push(null); // Indicates end of file
    
    // Create media object
    const media = {
      mimeType: file.type,
      body: stream
    };
    
    // Upload file to Drive
    const uploadedFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });
    
    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.data.id,
        name: uploadedFile.data.name,
        link: uploadedFile.data.webViewLink
      }
    });
    
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error uploading file',
        error: error.message
      },
      { status: 500 }
    );
  }
} 