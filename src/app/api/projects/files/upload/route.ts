import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { FILES_BUCKET } from '@/lib/api/storage';
// Import the server client (assuming it exists and is configured for service role)
// import { createServiceRoleClient } from '@/lib/api/server'; // Ensure this is removed/commented

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // --- Create Supabase Client ONCE --- 
    const supabase = createApiClient(); // Create client instance at the start

    // 1. Authenticate the user using the created client
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API /projects/files/upload] Authentication FAILED:', { error: authError?.message, userExists: !!user });
      return NextResponse.json(
        { error: authError?.message || 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = user.id; // Get user ID
    console.log(`[API /projects/files/upload] Authenticated user: ${userId}`);

    // 2. Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const projectType = formData.get('projectType') as string;

    if (!file || !projectId || !projectType) {
      return NextResponse.json(
        { error: 'Missing required parameters (file, projectId, projectType)' },
        { status: 400 }
      );
    }

    // --- Validation for Project Type --- (Add more specific validation if needed)
    const validProjectTypes = ['web_design', 'logo_design', 'social_graphics'];
    if (!validProjectTypes.includes(projectType)) {
       return NextResponse.json(
         { error: 'Invalid project type provided.' },
         { status: 400 }
       );
    }
    // --- End Validation ---

    // 3. Create storage path (NEW UNIFIED STRUCTURE)
    // Sanitize filename (optional but recommended)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); 
    // New path: {userId}/projects/{projectType}/{projectId}/{sanitizedFileName}
    const filePath = `${userId}/projects/${projectType}/${projectId}/${sanitizedFileName}`;
    console.log(`[API /projects/files/upload] Using unified path structure: ${filePath}`);

    // 4. Upload file to Supabase storage using the SAME client instance
    // const supabase = createApiClient(); // REMOVE duplicate client creation
    const { data: storageData, error: storageError } = await supabase.storage // Use existing supabase instance
      .from(FILES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Set to false to prevent overwriting existing files with the same name
      });

    if (storageError) {
      // Handle potential file conflict error specifically
      if (storageError.message.includes('already exists')) {
         return NextResponse.json(
           { error: `File with name "${sanitizedFileName}" already exists in this project folder. Please rename the file or delete the existing one.` },
           { status: 409 } // 409 Conflict
         );
      }
      console.error('Error uploading file to storage:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage.' },
        { status: 500 }
      );
    }
    
    if (!storageData) { // Should not happen if error is null, but good check
        return NextResponse.json(
          { error: 'Storage upload returned no data.' },
          { status: 500 }
        );
    }

    // 5. Insert metadata into user_files table - Ensure using standard client
    console.log('[API /projects/files/upload] Attempting DB insert with standard client...');
    // Remove any temporary try/catch or usage of supabaseAdmin
    const { data: dbData, error: dbError } = await supabase // Use the standard client
      .from('user_files')
      .insert({
        user_id: userId,
        project_id: projectId,
        project_type: projectType,
        file_path: filePath, // <-- Save the new unified path
        file_name: sanitizedFileName,
        file_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[API /projects/files/upload] Error inserting file metadata into database:', dbError);
      // Attempt cleanup with the regular client
      try {
        await supabase.storage.from(FILES_BUCKET).remove([filePath]);
        console.log('Cleaned up orphaned storage file after DB error:', filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned storage file after DB error:', filePath, cleanupError);
      }
      return NextResponse.json(
        { error: `Failed to save file metadata after upload: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('[API /projects/files/upload] DB insert SUCCESSFUL with standard client.');
    return NextResponse.json(dbData); // Return the record from user_files table

  } catch (error) {
    console.error('Error in file upload API (outer catch):', error);
    // Handle potential errors from reading formData
    if (error instanceof Error && error.message.includes('Could not parse content')) {
       return NextResponse.json(
         { error: 'Invalid request format. Ensure data is sent as FormData.' },
         { status: 400 }
       );
    }
    return NextResponse.json(
      { error: 'Server error processing file upload.' },
      { status: 500 }
    );
  }
}

// Removed unused helper function formatFileSize

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 