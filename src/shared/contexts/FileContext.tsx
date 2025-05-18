import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/api/client';
import { FILES_BUCKET } from '@/lib/api/storage';

// --- SCOPE TYPE ---
export type Scope = 'all' | 'photos' | 'documents';

// Define file object type
export interface FileObject {
  id: string;
  fullPath: string; // This will be the storage path like users/{uid}/files/{filename}
  name: string;
  extension?: string | null;
  isFolder: false; // Folders are no longer a user-facing concept in this UI
  user_id: string | null;
  // project_id and project_type are removed as files are no longer project-scoped in this context
  uploaded_at?: string | null;
  size?: number | null;
  mime_type?: string | null;
}

// Interface for the data shape received from /api/client/all-user-files
// This might need adjustment if the API changes, but for now, we adapt on the client
interface AllUserFileResponse {
  id: string;
  file_name: string | null;
  file_path: string;
  is_folder: boolean; // We will filter these out
  file_size: number | null;
  file_type: string | null; // formerly mime_type for FileObject
  uploaded_at: string;
  project_id: string | null; // Will be ignored
  project_type: string | null; // Will be ignored
  user_id: string | null;
}

interface FileContextType {
  files: FileObject[];         // All non-folder files for the user
  activeScope: Scope;
  setActiveScope: (s: Scope) => void;
  selectedFile: FileObject | null;
  isLoading: boolean;
  error: Error | string | null;
  uploadProgress: number;
  loadFiles: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>; // targetScopePath removed
  deleteFile: (file: FileObject) => Promise<void>;
  selectFile: (file: FileObject | null) => void;
  
  // For view toggle (list/gallery) as per user's FileList.tsx patch
  listView: 'list' | 'gallery'; 
  setListView: (view: 'list' | 'gallery') => void;
}

const defaultContext: FileContextType = {
  files: [],
  activeScope: 'all',
  setActiveScope: () => {},
  selectedFile: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
  loadFiles: async () => {},
  uploadFile: async (_file) => {},
  deleteFile: async () => {},
  selectFile: () => {},
  listView: 'list',
  setListView: () => {},
};

const FileContext = createContext<FileContextType>(defaultContext);

export const useFiles = () => useContext(FileContext);

async function initStorage() {
  try {
    console.log('Checking storage bucket:', FILES_BUCKET);
    try {
      const { error } = await supabase.storage.from(FILES_BUCKET).list('');
      if (!error) {
        console.log(`Bucket ${FILES_BUCKET} exists and is accessible`);
        return;
      }
    } catch (e) {
      console.log('Error checking bucket existence:', e);
    }
    if ( supabase.storage && typeof (supabase.storage as any).createBucket === 'function') {
      console.log('Attempting to create bucket:', FILES_BUCKET);
      const { error } = await (supabase.storage as any).createBucket(FILES_BUCKET, {
        public: true,
        fileSizeLimit: 50_000_000,
      });
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`Bucket ${FILES_BUCKET} already exists`);
        } else if (error.message.includes('row-level security policy')) {
          console.warn('RLS policy prevented bucket creation, assuming bucket exists');
        } else {
          console.error('Error initializing storage bucket:', error);
        }
      } else {
        console.log(`Successfully created bucket: ${FILES_BUCKET}`);
      }
    } else {
      console.warn('createBucket method not available - this may be expected depending on Supabase version');
      console.warn('Make sure to create the bucket manually in the Supabase dashboard');
    }
  } catch (err) {
    console.warn('Error in initStorage:', err);
  }
}

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [activeScope, setActiveScope] = useState<Scope>('all');
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const [listView, setListView] = useState<'list' | 'gallery'>('list'); // Added for view toggle

  const { toast } = useToast();
  
  useEffect(() => {
    if (!bucketInitialized) {
      setBucketInitialized(true);
      initStorage();
    }
  }, [bucketInitialized]);
  
  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(sessionError?.message || 'User session not found.');
      }
      const response = await fetch('/api/client/all-user-files', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        let errorMsg = `Failed to fetch files: ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) {}
        throw new Error(errorMsg);
      }
      const data: AllUserFileResponse[] = await response.json();
      
      // Filter out folders and map to FileObject
      const mappedFiles: FileObject[] = data
        .filter(item => !item.is_folder) // Exclude folders
        .map((item: AllUserFileResponse) => ({
          id: item.id,
          fullPath: item.file_path, // This is the direct storage path
          name: item.file_name ?? item.id,
          extension: item.file_path?.includes('.') ? item.file_path.split('.').pop()! : null,
          isFolder: false, // Explicitly set to false
          user_id: item.user_id,
          // project_id and project_type are no longer part of FileObject for this context
          uploaded_at: item.uploaded_at,
          size: item.file_size ?? null,
          mime_type: item.file_type ?? null,
        }));
      
      console.log('[FileContext - loadFiles] Fetched and mapped files (excluding folders): ', mappedFiles.length, 'items');
      setFiles(mappedFiles);
      // No longer setting currentFolder or updating folderPathArray
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading files';
      console.error('Error listing files from API:', err);
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  const selectFileCb = useCallback((file: FileObject | null) => { // Renamed to avoid conflict
    setSelectedFile(file);
  }, []);

  const uploadFileCb = useCallback(async (file: File) => { // Renamed and signature changed
    if (!file) return;
    setUploadProgress(0);
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(userError?.message || 'Auth error');
      
      const sanitizedFilename = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      
      // Simplified storage path: users/{uid}/files/{filename}
      const storagePath = `users/${user.id}/files/${sanitizedFilename}`;
      
      const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(storagePath, file, { upsert: false });
      if (uploadError) {
        if (uploadError.message.includes('Duplicate')) throw new Error(`File "${sanitizedFilename}" already exists.`);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // DB entry: project_id and project_type are null or not included
      const { error: dbError } = await supabase.from('user_files').insert({
        user_id: user.id,
        project_id: null,     // No longer project-scoped
        project_type: null,   // No longer project-scoped
        file_path: storagePath, // DB stores the full storage path
        file_name: sanitizedFilename,
        file_type: file.type,
        file_size: file.size,
        is_folder: false, // Always false for new uploads
      }).select().single();

      if (dbError) {
        await supabase.storage.from(FILES_BUCKET).remove([storagePath]); // Rollback storage
        throw new Error(`Metadata save failed: ${dbError.message}`);
      }
      toast({ title: 'Success', description: `File ${file.name} uploaded.` });
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Delay seems unnecessary
      await loadFiles(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error uploading';
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      // setTimeout(() => { // Delay seems unnecessary
        setUploadProgress(0);
        setIsLoading(false);
      // }, 1000);
    }
  }, [toast, loadFiles]); // Removed currentFolder and files from deps

  const deleteFileCb = useCallback(async (fileObject: FileObject) => { // Renamed
    if (!fileObject) return;
    // Since isFolder is always false for FileObjects in this context, simplify delete.
    // The old delete logic had special handling for folders, which is not needed.
    setIsLoading(true);
    setError(null);
    try {
      const { error: dbDeleteError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileObject.id); 

      if (dbDeleteError) {
        console.error('Error deleting file metadata from DB:', dbDeleteError);
        throw new Error(`DB delete failed: ${dbDeleteError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove([fileObject.fullPath]);
      if (storageError && storageError.message !== 'The resource was not found') {
        // Log warning but don't necessarily throw if DB record is gone, especially for "not found"
        console.warn(`Storage deletion warning for file ${fileObject.name}:`, storageError.message);
      }

      toast({ title: 'Success', description: `File '${fileObject.name}' deleted.` });
      await loadFiles(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting item';
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadFiles]); // Removed files from deps, loadFiles will refresh it

  return (
    <FileContext.Provider
      value={{
        files,
        activeScope,
        setActiveScope,
        selectedFile,
        isLoading,
        error,
        uploadProgress,
        loadFiles,
        uploadFile: uploadFileCb, // Use renamed version
        deleteFile: deleteFileCb, // Use renamed version
        selectFile: selectFileCb, // Use renamed version
        listView,
        setListView,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};