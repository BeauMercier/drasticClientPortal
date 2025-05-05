import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { FILES_BUCKET } from '@/lib/api/storage';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userFileId: string } }
) {
  try {
    // 1. Authenticate the user
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) { // Check user object
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    const userId = authResult.user.id;

    // 2. Get userFileId from route parameters
    const { userFileId } = params;
    if (!userFileId) {
       return NextResponse.json(
         { error: 'File ID is required.' },
         { status: 400 }
       );
    }

    // 3. Create Supabase client (respects RLS for DB operations)
    const supabase = createApiClient();

    // 4. Attempt to delete the database record first
    // RLS policy should enforce that users can only delete their own files
    // or admins/designers can delete based on project assignment/role.
    const { data: deletedRecord, error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', userFileId)
      // Optional: Add explicit user_id check if RLS is not fully trusted/implemented yet
      // .eq('user_id', userId) 
      .select() // Select the record *before* deleting to get its file_path
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') { // Code for "No rows returned"
        return NextResponse.json(
          { error: 'File not found or you do not have permission to delete it.' },
          { status: 404 } // Not Found or Forbidden
        );
      }
      console.error('Error deleting file metadata from database:', dbError);
      return NextResponse.json(
        { error: `Database error deleting file: ${dbError.message}` },
        { status: 500 }
      );
    }
    
    if (!deletedRecord || !deletedRecord.file_path) {
        // This case shouldn't ideally happen if dbError is null, but good practice
        console.error('Deleted record data is missing file_path');
        // Consider logging this as a potential issue, but maybe still proceed
        // to storage deletion if possible, or return error.
         return NextResponse.json(
           { error: 'Could not retrieve file path for storage deletion.' },
           { status: 500 }
         );
    }

    // 5. Attempt to delete the file from storage
    const filePathToDelete = deletedRecord.file_path;
    
    // Use Service Role client for storage deletion? 
    // RLS on storage might prevent user from deleting if path doesn't match user_id prefix.
    // Let's stick with user client for now and rely on RLS + path structure.
    // If needed, switch to createServiceRoleClient() for storage deletion.
    const { error: storageError } = await supabase.storage
        .from(FILES_BUCKET)
        .remove([filePathToDelete]);

    if (storageError) {
        // Log the error, but maybe don't fail the whole request if DB record was deleted?
        // Depends on desired behavior for orphaned files.
        console.warn('Error deleting file from storage (DB record deleted successfully):', storageError);
        // Optionally, you could try to restore the DB record here if strict consistency is needed
        // For now, we'll return success but log the warning.
    }

    // 6. Return success
    // Return the deleted record details for potential UI use
    return NextResponse.json({ message: 'File deleted successfully', deletedFile: deletedRecord });

  } catch (error) {
    console.error('Error in DELETE /api/user-files/[userFileId]:', error);
    return NextResponse.json(
      { error: 'Server error deleting file.' },
      { status: 500 }
    );
  }
} 