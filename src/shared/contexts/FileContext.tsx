import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import supabase from '@/lib/api/client';
import { FILES_BUCKET } from '@/lib/api/storage';

// Define file object type
export interface FileObject {
  id: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  size?: number;
  created_at: string;
  extension?: string;
  url?: string;
}

interface FolderPath {
  id: string;
  name: string;
}

interface FileContextType {
  files: FileObject[];
  currentFolder: string;
  folderPath: FolderPath[];
  selectedFile: FileObject | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  loadFiles: (folderId?: string) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  createFolder: (folderName: string) => Promise<void>;
  deleteFile: (file: FileObject) => Promise<void>;
  selectFile: (file: FileObject | null) => void;
  navigateToFolder: (folderId: string) => void;
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
  uploadFile: async () => {},
  createFolder: async () => {},
  deleteFile: async () => {},
  selectFile: () => {},
  navigateToFolder: () => {},
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
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize storage bucket on first render
  React.useEffect(() => {
    if (!bucketInitialized) {
      setBucketInitialized(true);
      initStorage();
    }
  }, [bucketInitialized, setBucketInitialized]);
  
  // Update folder path breadcrumbs
  const updateFolderPath = useCallback((relativePath: string) => {
    if (!relativePath) {
      setFolderPath([]);
      return;
    }

    const parts = relativePath.split('/').filter(p => p); // Filter empty parts
    const pathItems: FolderPath[] = [];
    
    let currentRelativePath = '';
    for (const part of parts) {
      currentRelativePath = currentRelativePath ? `${currentRelativePath}/${part}` : part;
      pathItems.push({
        id: currentRelativePath, // ID is the relative path within /general/
        name: part
      });
    }
    
    setFolderPath(pathItems);
  }, [setFolderPath]);
  
  // Load files from the current or specified folder within the user's /general directory
  const loadFiles = useCallback(async (relativeFolderId?: string) => {
    setIsLoading(true);
    setError(null);
    
    const targetRelativeFolder = relativeFolderId !== undefined ? relativeFolderId : currentFolder;

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Authentication error');
      }
      
      if (!user) {
        throw new Error('You must be logged in to view files');
      }
      
      // Base path for the user's general files
      const userGeneralPath = `${user.id}/general`;
      // Construct the full path to list in storage
      const storageListPath = targetRelativeFolder 
        ? `${userGeneralPath}/${targetRelativeFolder}` 
        : userGeneralPath;
      
      console.log('[FileContext - loadFiles] Listing files from bucket:', FILES_BUCKET);
      console.log('[FileContext - loadFiles] Storage List Path:', storageListPath);
      
      // List files from Supabase storage
      const { data, error: listError } = await supabase.storage
        .from(FILES_BUCKET)
        .list(storageListPath, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      console.log('[FileContext - loadFiles] Raw response from storage.list:', { data, listError });
      
      if (listError) {
        throw new Error(`Failed to load files: ${listError.message}`);
      }
      
      if (!data) {
        console.log('[FileContext - loadFiles] storage.list returned null data.');
        setFiles([]);
        return;
      }
      
      // Transform to FileObject format
      const fileObjects: FileObject[] = data
        .filter(item => item.name !== '.keep') // Filter out .keep files used for folders
        .map(item => {
          // Check if it's a folder by seeing if metadata is null (standard files have metadata)
          // Or if the name doesn't contain a dot (basic folder name check, less reliable)
          const isFolder = !item.metadata; // Primary check for folders created via API/empty uploads
          const fullStoragePath = `${storageListPath}/${item.name}`;
          
          return {
            id: fullStoragePath, // Use full path as unique ID
            name: item.name,
            fullPath: fullStoragePath,
            isFolder,
            size: isFolder ? undefined : item.metadata?.size,
            created_at: item.created_at || new Date().toISOString(),
            extension: isFolder ? undefined : item.name.split('.').pop(),
          };
        });
      
      console.log('[FileContext - loadFiles] Fetched file objects (relative to general): ', fileObjects.map(f => f.name));
      
      setFiles(fileObjects);
      
      // If folder changed, update state and breadcrumbs
      if (targetRelativeFolder !== currentFolder) {
        setCurrentFolder(targetRelativeFolder);
        updateFolderPath(targetRelativeFolder);
      }
      // Ensure breadcrumbs are updated even on initial load or refresh of the same folder
      else if (relativeFolderId === undefined) {
           updateFolderPath(currentFolder);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading files';
      console.error('Error listing files:', err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, updateFolderPath, setIsLoading, setError, supabase, setFiles, setCurrentFolder, toast]);
  
  // Upload a file to the current folder
  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;
    
    setUploadProgress(0);
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Authentication error');
      }
      
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }
      
      // Base path for the user's files
      const basePath = user.id;
      
      // Sanitize the filename - replace spaces with underscores and remove any problematic characters
      const sanitizedFilename = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      
      // Define the general folder path
      const generalFolderPath = `${basePath}/general`;
      const currentSubFolder = currentFolder ? `/${currentFolder}` : ''; // Keep subfolder navigation within general

      // Path for storage: {userId}/general/{currentSubFolder}/{sanitizedFileName}
      // Note: We avoid adding a timestamp here now as the API route doesn't, rely on storage policy for conflicts.
      const storagePath = `${generalFolderPath}${currentSubFolder}/${sanitizedFilename}`;
       
      console.log('[FileContext - uploadFile] Attempting upload to storage bucket:', FILES_BUCKET);
      console.log('[FileContext - uploadFile] Calculated storagePath:', storagePath);
      console.log('[FileContext - uploadFile] File details:', { name: file.name, size: file.size, type: file.type });
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
         .from(FILES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false, // Keep upsert false to avoid accidental overwrites
        });
      
      if (uploadError) {
        // Handle potential file conflict error specifically if upsert is false
        if (uploadError.message.includes('Duplicate')) { // Check for Supabase duplicate error message
           throw new Error(`File with name "${sanitizedFilename}" already exists in this folder. Please rename the file or delete the existing one.`);
        } 
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // --- Add Database Insert --- 
      console.log('[FileContext - uploadFile] Storage upload successful. Attempting DB insert...');
      const { data: dbData, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: user.id,
          project_id: null, // No specific project for general uploads
          project_type: 'general', // Mark as general
          file_path: storagePath, // The path used for storage
          file_name: sanitizedFilename,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        console.error('[FileContext - uploadFile] Error inserting file metadata into database:', dbError);
        // Attempt cleanup of orphaned storage file
        try {
          await supabase.storage.from(FILES_BUCKET).remove([storagePath]);
          console.log('[FileContext - uploadFile] Cleaned up orphaned storage file after DB error:', storagePath);
        } catch (cleanupError) {
          console.error('[FileContext - uploadFile] Failed to cleanup orphaned storage file after DB error:', storagePath, cleanupError);
        }
        throw new Error(`Failed to save file metadata after upload: ${dbError.message}`);
      }
      console.log('[FileContext - uploadFile] DB insert successful.', dbData);
      // --- End Database Insert ---

      // Complete the upload
      setUploadProgress(100);
      toast({
        title: 'Success',
        description: `File ${file.name} uploaded successfully`,
      });
      
      // Reload files to see the new one - ADD DELAY
      console.log('[FileContext - uploadFile] Upload successful. Waiting briefly before reloading file list...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2000ms (2 seconds)
      console.log('[FileContext - uploadFile] Reloading file list now.');
      await loadFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error uploading file';
      console.error('Error uploading file:', err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      // Reset upload state after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsLoading(false);
      }, 1000);
    }
  }, [currentFolder, loadFiles, setUploadProgress, setIsLoading, setError, supabase, toast]);
  
  // Create a new folder
  const createFolder = useCallback(async (folderName: string) => {
    if (!folderName.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name cannot be empty',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Authentication error');
      }
      
      if (!user) {
        throw new Error('You must be logged in to create folders');
      }
      
      // Base path for the user's files
      const basePath = user.id;
      
      // Define the general folder path
      const generalFolderPath = `${basePath}/general`;
      const currentSubFolder = currentFolder ? `/${currentFolder}` : ''; // Keep subfolder navigation within general

      // Path for the placeholder file within the general folder structure
      const storagePath = `${generalFolderPath}${currentSubFolder}/${folderName.trim()}/.keep`; // Use .keep placeholder
       
      console.log('Creating folder placeholder in bucket:', FILES_BUCKET);
      console.log('Path:', storagePath);
       
       // Create a folder JSON file like in the original project
       // Using an empty .keep file is a common pattern for creating folders in object storage
       const { error: folderError } = await supabase.storage
         .from(FILES_BUCKET)
         .upload(storagePath, new Blob(['']), { // Upload an empty blob
           contentType: 'text/plain',
           upsert: false,
         });
      
      if (folderError) {
        throw new Error(`Failed to create folder: ${folderError.message}`);
      }
      
      toast({
        title: 'Success',
        description: `Folder ${folderName} created successfully`,
      });
      
      // Reload files to see the new folder
      await loadFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating folder';
      console.error('Error creating folder:', err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, loadFiles, setError, setIsLoading, supabase, toast]);
  
  // Delete a file or folder
  const deleteFile = useCallback(async (file: FileObject) => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (file.isFolder) {
        // For folders, list and delete all contents recursively
        const { data, error: listError } = await supabase.storage
          .from(FILES_BUCKET)
          .list(file.fullPath);
        
        if (listError) {
          throw new Error(`Failed to list folder contents: ${listError.message}`);
        }
        
        // Delete all files in the folder
        for (const item of data) {
          const itemPath = `${file.fullPath}/${item.name}`;
          const { error: deleteItemError } = await supabase.storage
            .from(FILES_BUCKET)
            .remove([itemPath]);
          
          if (deleteItemError) {
            console.error(`Failed to delete item ${itemPath}:`, deleteItemError);
          }
        }
      }
      
      // Delete the file or empty folder
      const { error: deleteError } = await supabase.storage
        .from(FILES_BUCKET)
        .remove([file.fullPath]);
      
      if (deleteError) {
        throw new Error(`Failed to delete ${file.isFolder ? 'folder' : 'file'}: ${deleteError.message}`);
      }
      
      // If the deleted file was selected, deselect it
      if (selectedFile && selectedFile.id === file.id) {
        setSelectedFile(null);
      }
      
      toast({
        title: 'Success',
        description: `${file.isFolder ? 'Folder' : 'File'} deleted successfully`,
      });
      
      // Reload files
      await loadFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting item';
      console.error('Error deleting file:', err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
    // TODO: Consider if the corresponding `user_files` database record needs explicit deletion here.
    // Currently, it relies on potential cascade deletes or other mechanisms. If orphaned records
    // become an issue, add a call to delete the DB record after successful storage deletion.
  }, [loadFiles, setError, setIsLoading, supabase, toast, selectedFile]);
  
  // Select a file
  const selectFile = useCallback((file: FileObject | null) => {
    setSelectedFile(file);
  }, [setSelectedFile]);
  
  // Navigate into a folder (folderId is relative path within /general/)
  const navigateToFolder = useCallback((relativeFolderId: string) => {
    console.log('[FileContext] Navigating to relative folder:', relativeFolderId);
    loadFiles(relativeFolderId);
  }, [loadFiles]);
  
  // Navigate up one level (relative to /general/)
  const navigateUp = useCallback(() => {
    if (!currentFolder) {
        console.log('[FileContext] Cannot navigate up from root general folder.');
        return; // Already at the root of /general/
    }
    const parts = currentFolder.split('/');
    const parentRelativeFolder = parts.slice(0, -1).join('/');
    console.log('[FileContext] Navigating up to relative folder:', parentRelativeFolder);
    loadFiles(parentRelativeFolder);
  }, [currentFolder, loadFiles]);
  
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