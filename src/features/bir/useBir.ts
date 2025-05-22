import useSWR from 'swr';
import { createClient } from '@/lib/api/client';
import { BirRow, BirFileRow, SignedBirFile } from '@/lib/types/bir'; // Use updated types
// import { Database } from '@/lib/database.types';

// Type for the data returned by the hook
export interface UseBirData {
  bir: BirRow | null;
  files: BirFileRow[] | null;
  signedFiles: SignedBirFile[] | null;
}

/**
 * Fetches Business Information Request (BIR) data and associated files for a project.
 * 
 * The process involves:
 * 1. Fetching the main BIR record from `business_information_requests`.
 * 2. Fetching all associated file metadata from `bir_file`.
 * 3. Generating signed URLs for each file in the `bir-files` storage bucket.
 *
 * IMPORTANT: Access to files in the `bir-files` storage bucket (and thus the success of
 * `createSignedUrl`) is governed by Row Level Security (RLS) policies defined in Supabase.
 * These policies typically grant access based on user roles (e.g., 'client', 'designer', 'admin')
 * and their association with the project or BIR.
 * - Clients can generally read files linked to their own BIRs.
 * - Designers can generally read files for projects they are assigned to.
 * - Admins usually have broader read access.
 * Ensure these RLS policies are correctly configured in the Supabase dashboard 
 * (Storage -> Policies for the `bir-files` bucket on the `storage.objects` table).
 */
const fetcher = async (projectId: string): Promise<UseBirData> => {
  if (!projectId) {
    throw new Error('Project ID is required to fetch BIR.');
  }

  const supabase = createClient(); // Get client-side Supabase instance

  // 1. Fetch the main BIR record
  const { data: birData, error: birError } = await supabase
    .from('business_information_requests')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (birError) {
    console.error('Error fetching BIR:', birError);
    throw new Error(birError.message || 'Failed to fetch Business Information Request.');
  }

  if (!birData) {
    return { bir: null, files: null, signedFiles: null };
  }

  // 2. Fetch associated files if BIR exists
  const { data: birFilesData, error: filesError } = await supabase // No 'as any' needed if types are correct
    .from('bir_file') // Use the correct table name
    .select('*')
    .eq('bir_id', birData.id)
    .order('uploaded_at', { ascending: false });

  if (filesError) {
    console.error('Error fetching BIR files:', filesError);
    return { bir: birData, files: null, signedFiles: null };
  }

  const typedBirFiles: BirFileRow[] = birFilesData || []; // Ensure it's an array

  // 3. Generate Signed URLs for the files
  let generatedSignedFiles: SignedBirFile[] = []; // Initialize to empty array, not null
  if (typedBirFiles.length > 0) {
    try {
      const signedUrlPromises = typedBirFiles.map(async (file) => {
        // Attempt to create a signed URL. Success depends on RLS policies
        // granting the current user SELECT permission on the storage object.
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from('bir-files')
          .createSignedUrl(file.storage_path, 60 * 60); // 1 hour expiry

        console.log(`[useBir] For file ${file.storage_path}:`, { signedUrlData, signError });

        if (signError) {
          // Gracefully handle "Object not found" errors specifically
          if (signError.message && (signError.message.includes('No object exists') || signError.message.includes('Object not found'))) {
            console.warn(`Signed URL generation for ${file.storage_path}: Object not found in storage. Marking as unavailable.`);
            return { ...file, publicUrl: undefined, error: 'not_found' }; // Add error indicator
          } else {
            console.error(`Error creating signed URL for ${file.storage_path}:`, signError);
            return { ...file, publicUrl: undefined, error: 'generic' }; // Add error indicator
          }
        }
        return { ...file, publicUrl: signedUrlData?.signedUrl, error: undefined }; // Clear error indicator
      });
      generatedSignedFiles = await Promise.all(signedUrlPromises);
    } catch (error) {
      console.error('Error generating signed URLs:', error);
      generatedSignedFiles = typedBirFiles.map((file) => ({
        ...file,
        publicUrl: undefined,
        error: 'generic', // Explicitly set error to 'generic'
      }));
    }
  }

  return { bir: birData, files: typedBirFiles, signedFiles: generatedSignedFiles };
};

/**
 * Fetches the single BIR attached to a project using SWR.
 * The API endpoint called relies on Supabase RLS to ensure the caller 
 * only sees data they are permitted to access.
 *
 * Args:
 *   projectId: The UUID of the project. If undefined, SWR will not fetch.
 *
 * Returns:
 *   An object containing:
 *     - bir: The fetched BIR data (Bir | null) or null if loading or not found.
 *     - birFiles: The fetched BIR files (BirRow[] | null) or null if loading or not found.
 *     - signedBirFiles: The signed URLs for the fetched BIR files (BirRow[] | null) or null if loading or not found.
 *     - isLoading: Boolean indicating if the request is in progress.
 *     - error: Any error object returned by SWR/fetcher.
 *     - mutate: The SWR mutate function to trigger revalidation.
 */
export function useBir(projectId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR<UseBirData>(
    projectId ? `bir-${projectId}` : null,
    () => (projectId ? fetcher(projectId) : Promise.resolve({ bir: null, files: null, signedFiles: null })),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    bir: data?.bir ?? null,
    birFiles: data?.files ?? null,
    signedBirFiles: data?.signedFiles ?? null,
    isLoading,
    error,
    mutate,
  };
} 