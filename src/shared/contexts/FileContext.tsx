import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/api/client';
import { FILES_BUCKET } from '@/lib/api/storage';

// --- SCOPE CONSTANTS ---
export const TOP_SCOPE_GENERAL = '__general__';
export const TOP_SCOPE_PROJECT_PREFIX = '__project_'; // e.g., __project_uuid

// Define file object type used by the context and FileList component
export interface FileObject {
  /* identifiers */
  id: string;
  fullPath: string;

  /* naming */
  name: string;
  extension?: string | null; // derived once on load

  /* structural */
  isFolder: boolean;

  /* ownership / grouping */
  user_id: string | null;
  project_id: string | null;
  project_type?: string | null;

  /* metadata */
  uploaded_at?: string | null; // Ensure this property exists if referenced, or remove if not used.
  size?: number | null; // unified size field
  mime_type?: string | null; // new – used for icons & "Type" column
}

// Interface for the data shape received from /api/client/all-user-files
interface AllUserFileResponse {
  id: string; // user_files.id
  file_name: string | null;
  file_path: string;
  is_folder: boolean;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
  project_id: string | null;
  project_type: string | null;
  user_id: string | null;
}

interface FolderPath {
  id: string; // Represents a segment of currentFolder path, or a scope ID
  name: string; // Display name for breadcrumb
}

interface FileContextType {
  files: FileObject[]; // This is the master list of all user_files items
  currentFolder: string; // Path string: '' (super-root), '__general__', '__general__/foo', '__project_uuid', '__project_uuid/bar'
  folderPath: FolderPath[];
  selectedFile: FileObject | null;
  isLoading: boolean;
  error: Error | string | null;
  uploadProgress: number;
  loadFiles: () => Promise<void>;
  uploadFile: (file: File, targetScopePath?: string) => Promise<void>; // Signature updated
  createFolder: (folderName: string, targetScopePath?: string) => Promise<void>; // Signature updated
  deleteFile: (file: FileObject) => Promise<void>;
  selectFile: (file: FileObject | null) => void;
  navigateToFolder: (path: string | null) => void; // Takes a path string or null for root
  navigateUp: () => void;
}

const defaultContext: FileContextType = {
  files: [],
  currentFolder: '',
  folderPath: [],
  selectedFile: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
  loadFiles: async () => {},
  uploadFile: async (_file, _targetScopePath) => {},
  createFolder: async (_folderName, _targetScopePath) => {},
  deleteFile: async () => {},
  selectFile: () => {},
  navigateToFolder: (_path: string | null) => {}, // Updated default to match signature
  navigateUp: () => {},
};

const FileContext = createContext<FileContextType>(defaultContext);

export const useFiles = () => useContext(FileContext);

// Initialize storage by ensuring the bucket exists
async function initStorage() {
  try {
    console.log('Checking storage bucket:', FILES_BUCKET);
    
    // First try to list the bucket to see if it exists
    try {
      const { error } = await supabase.storage.from(FILES_BUCKET).list('');
      if (!error) {
        console.log(`Bucket ${FILES_BUCKET} exists and is accessible`);
        return;
      }
    } catch (e) {
      console.log('Error checking bucket existence:', e);
    }
    
    // If we reach here, we need to check if createBucket is available
    // This is a safe check that handles different versions of Supabase client
    if (
      supabase.storage &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (supabase.storage as any).createBucket === 'function'
    ) {
      console.log('Attempting to create bucket:', FILES_BUCKET);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.storage as any).createBucket(FILES_BUCKET, {
        public: true,
        fileSizeLimit: 50_000_000, // 50MB limit
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
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize storage bucket on first render
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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store', // as per user suggestion in the prompt
      });

      if (!response.ok) {
        let errorMsg = `Failed to fetch files: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Ignore if response is not json
        }
        throw new Error(errorMsg);
      }
      
      const data: AllUserFileResponse[] = await response.json();
      
      const mapped: FileObject[] = data.map((item: AllUserFileResponse) => ({
        id: item.id,
        fullPath: item.file_path,
        name: item.file_name ?? item.id,
        extension: item.file_path?.includes('.')
          ? item.file_path.split('.').pop()!
          : null,
        isFolder: item.is_folder,
        user_id: item.user_id,
        project_id: item.project_id,
        project_type: item.project_type,
        uploaded_at: item.uploaded_at,
        size: item.file_size ?? null,
        mime_type: item.file_type ?? null,
      }));
      
      console.log('[FileContext - loadFiles] Fetched file objects from API: ', mapped.length, 'items');
      setFiles(mapped);
      setCurrentFolder(''); 
      updateFolderPathArray('');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading files';
      console.error('Error listing files from API:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load files on initial mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]); // loadFiles is memoized with useCallback, so this runs once on mount
  
  const updateFolderPathArray = useCallback((newPath: string) => {
    if (!newPath) {
      setFolderPath([]);
      setSelectedFile(null); // Clear selection when path changes
      return;
    }
    const segments = newPath.split('/');
    const newBreadcrumbs: FolderPath[] = [];

    let currentBuiltPath = '';
    segments.forEach((segment, index) => {
      currentBuiltPath = currentBuiltPath ? `${currentBuiltPath}/${segment}` : segment;
      let displayName = segment;
      if (index === 0) { // First segment is a scope
        if (segment === TOP_SCOPE_GENERAL) {
          displayName = TOP_SCOPE_GENERAL.replace(/^__SCOPE__|__$/g, '').split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
        } else if (segment.startsWith(TOP_SCOPE_PROJECT_PREFIX)) {
          const projectId = segment.replace(TOP_SCOPE_PROJECT_PREFIX, '');
          const projectFile = files.find(f => f.project_id === projectId);
          const projectType = projectFile?.project_type ? projectFile.project_type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Project';
          const projectRootFolder = files.find(pf => pf.project_id === projectId && pf.isFolder && pf.fullPath === `${TOP_SCOPE_PROJECT_PREFIX}${projectId}`);
          displayName = projectRootFolder?.name || `${projectType}`;
        }
      }
      newBreadcrumbs.push({ id: currentBuiltPath, name: displayName });
    });
    setFolderPath(newBreadcrumbs);
    setSelectedFile(null); // Clear selection when path changes to avoid stale selection
  }, [files, setFolderPath, setSelectedFile]); // Corrected dependencies

  // Effect to update breadcrumbs when currentFolder changes
  // This might be redundant if updateFolderPathArray is called synchronously with setCurrentFolder
  // useEffect(() => {
  //   updateFolderPathArray(currentFolder);
  // }, [currentFolder, updateFolderPathArray]); // Removed updateFolderPathArray from its own deps if it was there.

  const selectFile = useCallback((file: FileObject | null) => {
    setSelectedFile(file);
  }, []);

  const navigateToFolder = useCallback((path: string | null) => {
    const targetPath = path === null ? '' : path;
    // Basic validation: check if the target path is a prefix of any existing file or is an exact folder match
    // This is a light check; more robust validation might be needed if paths could be arbitrary.
    // For virtual top-level scopes, they are always valid.
    const isValidScope = targetPath === TOP_SCOPE_GENERAL || targetPath.startsWith(TOP_SCOPE_PROJECT_PREFIX) || targetPath === '';
    
    const isExistingFolderPath = files.some(f => f.isFolder && f.fullPath === targetPath);
    // Check if it's a path that could lead to other files (even if no direct folder object for it)
    const isPotentialParentPath = files.some(f => f.fullPath.startsWith(`${targetPath}/`));

    if (targetPath === '' || isValidScope || isExistingFolderPath || isPotentialParentPath) {
      setCurrentFolder(targetPath);
      updateFolderPathArray(targetPath);
      setSelectedFile(null); // Reset selected file on navigation
    } else {
      console.warn(`[FileContext] Attempted to navigate to non-existent or invalid path: ${targetPath}`);
      // Optionally, provide feedback to the user, e.g., via a toast notification
      // toast({ title: "Navigation Error", description: "The specified folder could not be found.", variant: "destructive" });
    }
  }, [files, setCurrentFolder, updateFolderPathArray, setSelectedFile, toast]); // Added files and toast to dependencies

  const navigateUp = useCallback(() => {
    if (currentFolder === '') return; // Already at root

    const segments = currentFolder.split('/');
    if (segments.length === 1) {
      // Was in a top-level scope (e.g., '__general__' or '__project_uuid'), go to super root
      setCurrentFolder('');
    } else {
      // Was in a subfolder, pop one segment
      const newPath = segments.slice(0, -1).join('/');
      setCurrentFolder(newPath);
    }
  }, [currentFolder]); // Removed setCurrentFolder from deps

  const uploadFile = useCallback(async (file: File, targetScopePath?: string) => {
    // targetScopePath examples: '' (for general root), TOP_SCOPE_GENERAL, TOP_SCOPE_PROJECT_PREFIX + projectId
    // If targetScopePath is TOP_SCOPE_GENERAL or TOP_SCOPE_PROJECT_PREFIX+id, files go into the root of that scope.
    // If currentFolder is deeper like TOP_SCOPE_GENERAL/foo, files go into foo.
    // This logic needs to be robust for where the upload is happening.
    // For now, assuming `currentFolder` correctly reflects the upload target path relative to a scope root if inside one.
    if (!file) return;
    setUploadProgress(0);
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(userError?.message || 'Auth error');
      
      const sanitizedFilename = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      let storagePrefix = `${user.id}/`; // Base for user
      let dbProjectId: string | null = null;
      let dbProjectType: string | null = 'general';
      let pathWithinScope = '';

      const effectiveTarget = targetScopePath !== undefined ? targetScopePath : currentFolder;

      if (effectiveTarget.startsWith(TOP_SCOPE_PROJECT_PREFIX)) {
        const projectId = effectiveTarget.split('/')[0].replace(TOP_SCOPE_PROJECT_PREFIX, '');
        const project = files.find(f => f.project_id === projectId && f.id.startsWith(TOP_SCOPE_PROJECT_PREFIX)); // Find virtual project folder
        dbProjectId = projectId;
        dbProjectType = project?.project_type || 'other'; // Fallback project type
        storagePrefix += `projects/${dbProjectType}/${dbProjectId}/`;
        pathWithinScope = effectiveTarget.split('/').slice(1).join('/');
      } else {
        // Includes TOP_SCOPE_GENERAL or empty string (super root implies general for new uploads)
        storagePrefix += 'general/';
        dbProjectType = 'general';
        pathWithinScope = effectiveTarget === TOP_SCOPE_GENERAL ? '' : effectiveTarget.replace(TOP_SCOPE_GENERAL + '/', '').replace(TOP_SCOPE_GENERAL, '');
      }

      const finalStoragePath = `${storagePrefix}${pathWithinScope ? pathWithinScope + '/' : ''}${sanitizedFilename}`;
      const finalDbPath = finalStoragePath; // In user_files, file_path is the full storage path

      const { error: uploadError } = await supabase.storage.from(FILES_BUCKET).upload(finalStoragePath, file, { upsert: false });
      if (uploadError) {
        if (uploadError.message.includes('Duplicate')) throw new Error(`File "${sanitizedFilename}" already exists.`);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      const { data: dbData, error: dbError } = await supabase.from('user_files').insert({
        user_id: user.id,
        project_id: dbProjectId,
        project_type: dbProjectType,
        file_path: finalDbPath,
        file_name: sanitizedFilename,
        file_type: file.type,
        file_size: file.size,
        is_folder: false,
      }).select().single();
      if (dbError) {
        await supabase.storage.from(FILES_BUCKET).remove([finalStoragePath]);
        throw new Error(`Metadata save failed: ${dbError.message}`);
      }
      toast({ title: 'Success', description: `File ${file.name} uploaded.` });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error uploading';
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setTimeout(() => {
        setUploadProgress(0);
        setIsLoading(false);
      }, 1000);
    }
  }, [currentFolder, files, toast, loadFiles]);

  const createFolder = useCallback(async (folderName: string, targetScopePath?: string) => {
    if (!folderName.trim()) {
      toast({ title: 'Error', description: 'Folder name empty', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(userError?.message || 'Auth error');

      const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
      let storagePrefix = `${user.id}/`;
      let dbProjectId: string | null = null;
      let dbProjectType: string | null = 'general';
      let pathWithinScope = '';

      const effectiveTarget = targetScopePath !== undefined ? targetScopePath : currentFolder;

      if (effectiveTarget.startsWith(TOP_SCOPE_PROJECT_PREFIX)) {
        const projectId = effectiveTarget.split('/')[0].replace(TOP_SCOPE_PROJECT_PREFIX, '');
        const project = files.find(f => f.project_id === projectId && f.id.startsWith(TOP_SCOPE_PROJECT_PREFIX));
        dbProjectId = projectId;
        dbProjectType = project?.project_type || 'other';
        storagePrefix += `projects/${dbProjectType}/${dbProjectId}/`;
        pathWithinScope = effectiveTarget.split('/').slice(1).join('/');
      } else {
        storagePrefix += 'general/';
        dbProjectType = 'general';
        pathWithinScope = effectiveTarget === TOP_SCOPE_GENERAL ? '' : effectiveTarget.replace(TOP_SCOPE_GENERAL + '/', '').replace(TOP_SCOPE_GENERAL, '');
      }

      const finalFolderPathForDb = `${storagePrefix}${pathWithinScope ? pathWithinScope + '/' : ''}${sanitizedFolderName}`;
      const storagePlaceholderPath = `${finalFolderPathForDb}/.keep`;

      const { error: folderError } = await supabase.storage.from(FILES_BUCKET).upload(storagePlaceholderPath, new Blob(['']), { upsert: false });
      if (folderError && !folderError.message.includes('Duplicate')) {
        throw new Error(`Storage folder creation failed: ${folderError.message}`);
      }
      const { data: dbData, error: dbError } = await supabase.from('user_files').insert({
        user_id: user.id,
        project_id: dbProjectId,
        project_type: dbProjectType,
        file_path: finalFolderPathForDb,
        file_name: sanitizedFolderName,
        is_folder: true,
        file_type: null,
        file_size: null,
      }).select().single();
      if (dbError) {
        if (dbError.message.includes('duplicate key value violates unique constraint')) {
          console.log('Folder record already in DB:', finalFolderPathForDb);
        } else {
          if (!folderError || !folderError.message.includes('Duplicate')) {
            try {
              await supabase.storage.from(FILES_BUCKET).remove([storagePlaceholderPath]);
            } catch (e) {
              /* ignore */
            }
          }
          throw new Error(`Folder DB record failed: ${dbError.message}`);
        }
      }
      toast({ title: 'Success', description: `Folder ${sanitizedFolderName} created.` });
      await loadFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating folder';
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, files, toast, loadFiles]);

  const deleteFile = useCallback(async (file: FileObject) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Delete from user_files table by its actual ID
      const { error: dbDeleteError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id); // file.id is user_files.id

      if (dbDeleteError) {
        // If RLS prevents delete or record not found, it might error here.
        // PGRST116 is 'request did not satisfy' (e.g. RLS or record not found for .single())
        // but for delete, it might just return count 0 if not found and RLS passes.
        console.error('Error deleting file/folder metadata from DB:', dbDeleteError);
        throw new Error(`DB delete failed: ${dbDeleteError.message}`);
      }

      // 2. Delete from storage using fullPath
      if (file.isFolder) {
        // For folders, list all DB entries under this folder path and remove them from storage.
        // This is more robust than listing storage directly if user_files is source of truth.
        // This requires children to have file_path starting with parent's file_path + '/'
        const childrenFiles = files.filter(f => 
          f.fullPath.startsWith(file.fullPath + '/') && 
          f.user_id === file.user_id // Ensure same user, though RLS on API should cover
        );
        
        const storagePathsToRemove: string[] = childrenFiles.map(f => f.fullPath);
        // Also add the .keep file for the folder itself if that convention is still used for empty folders in storage
        storagePathsToRemove.push(`${file.fullPath}/.keep`); 
        // Add the folder path itself for services that might delete empty prefixes
        storagePathsToRemove.push(file.fullPath);

        if (storagePathsToRemove.length > 0) {
            const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove(storagePathsToRemove);
            if (storageError) {
                console.warn(`Storage deletion warning for folder contents of ${file.name}:`, storageError.message);
                // Don't necessarily throw, as DB record is gone. Log and continue.
            }
        }
      } else {
        // It's a file
        const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove([file.fullPath]);
        if (storageError && storageError.message !== 'The resource was not found') {
          console.warn(`Storage deletion warning for file ${file.name}:`, storageError.message);
        }
      }

      toast({ title: 'Success', description: `${file.isFolder ? 'Folder' : 'File'} '${file.name}' deleted.` });
      await loadFiles(); // Refresh from source of truth
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting item';
      setError(err as Error);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [files, toast, loadFiles]);

  return (
    <FileContext.Provider
      value={{
        files,
        currentFolder,
        folderPath,
        selectedFile,
        isLoading,
        error,
        uploadProgress,
        loadFiles,
        uploadFile,
        createFolder,
        deleteFile,
        selectFile,
        navigateToFolder,
        navigateUp,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};