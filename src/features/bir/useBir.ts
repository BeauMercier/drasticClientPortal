import useSWR from 'swr';
import { createClient } from '@/lib/api/client'; // Assuming client-side Supabase client setup
import { BirRow } from '@/lib/types/bir';
import { Database } from '@/lib/database.types'; // Assuming generated types

// Define placeholder type for BirFileRow until types are regenerated
// TODO: Replace with Database['public']['Tables']['bir_file']['Row'] after regenerating types
type BirFileRow = {
  id: string;
  bir_id: string;
  file_type: string; // 'logo' | 'style_guide' | 'photo' | 'certificate' | 'misc'
  original_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
};

// Type for the data returned by the hook
export interface UseBirData {
  bir: BirRow | null;
  files: BirFileRow[] | null; // Use placeholder type
  signedFiles: (BirFileRow & { publicUrl?: string })[] | null; // Use placeholder type
}

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
    // No BIR found for this project, return nulls
    return { bir: null, files: null, signedFiles: null };
  }

  // 2. Fetch associated files if BIR exists
  // TODO: Remove 'as any' once Supabase types are regenerated
  const { data: birFiles, error: filesError } = await (supabase as any)
    .from('bir_file') // Use the correct table name
    .select('*')
    .eq('bir_id', birData.id)
    .order('uploaded_at', { ascending: false });

  if (filesError) {
    console.error('Error fetching BIR files:', filesError);
    // Don't throw, maybe just return BIR data without files
    return { bir: birData, files: null, signedFiles: null };
  }

  // 3. Generate Signed URLs for the files
  let signedFiles: (BirFileRow & { publicUrl?: string })[] | null = null; // Use placeholder type
  if (birFiles && birFiles.length > 0) {
    try {
      const typedBirFiles = birFiles as BirFileRow[]; // Assert type here
      const signedUrlPromises = typedBirFiles.map(async (file) => {
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from('bir-files') // Use the correct bucket name
          .createSignedUrl(file.storage_path, 60 * 60); // 1 hour expiry

        if (signError) {
          console.error(`Error creating signed URL for ${file.storage_path}:`, signError);
          return { ...file, publicUrl: undefined }; // Return file data without URL on error
        }
        return { ...file, publicUrl: signedUrlData?.signedUrl };
      });
      signedFiles = await Promise.all(signedUrlPromises);
    } catch (error) {
      console.error('Error generating signed URLs:', error);
      // Proceed without signed URLs if generation fails
      signedFiles = (birFiles as BirFileRow[]).map((file) => ({ ...file, publicUrl: undefined })); // Assert type here
    }
  }

  // Return combined data
  return { bir: birData, files: (birFiles as BirFileRow[] | null), signedFiles: signedFiles };
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
    projectId ? `bir-${projectId}` : null, // Unique key per project, null if no projectId
    () => (projectId ? fetcher(projectId) : Promise.resolve({ bir: null, files: null, signedFiles: null })), // Pass projectId to fetcher
    {
      revalidateOnFocus: false, // Optional: configure SWR as needed
      shouldRetryOnError: false,
    }
  );

  return {
    bir: data?.bir ?? null,
    birFiles: data?.files ?? null,
    signedBirFiles: data?.signedFiles ?? null,
    isLoading,
    error,
    mutate, // Expose mutate for revalidation
  };
} 