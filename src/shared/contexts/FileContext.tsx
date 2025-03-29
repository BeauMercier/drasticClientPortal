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
  const updateFolderPath = useCallback((folder: string) => {
    if (!folder) {
      setFolderPath([]);
      return;
    }

    const parts = folder.split('/');
    const pathItems: FolderPath[] = [];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      pathItems.push({
        id: currentPath,
        name: part
      });
    }
    
    setFolderPath(pathItems);
  }, [setFolderPath]);
  
  // Load files from the current or specified folder
  const loadFiles = useCallback(async (folderId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Authentication error');
      }
      
      if (!user) {
        throw new Error('You must be logged in to view files');
      }
      
      // Determine which folder to load
      const folderToLoad = folderId !== undefined ? folderId : currentFolder;
      
      // Base path for the user's files
      const basePath = user.id;
      const fullPath = folderToLoad ? `${basePath}/${folderToLoad}` : basePath;
      
      console.log('Listing files from bucket:', FILES_BUCKET);
      console.log('Path:', fullPath);
      
      // List files from Supabase storage
      const { data, error: listError } = await supabase.storage
        .from(FILES_BUCKET)
        .list(fullPath, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (listError) {
        throw new Error(`Failed to load files: ${listError.message}`);
      }
      
      if (!data) {
        setFiles([]);
        return;
      }
      
      // Transform to FileObject format
      const fileObjects: FileObject[] = data.map(item => {
        const isFolder = !item.metadata;
        return {
          id: `${fullPath}/${item.name}`,
          name: item.name,
          fullPath: `${fullPath}/${item.name}`,
          isFolder,
          size: isFolder ? undefined : item.metadata?.size,
          created_at: item.created_at || new Date().toISOString(),
          extension: isFolder ? undefined : item.name.split('.').pop(),
        };
      });
      
      setFiles(fileObjects);
      
      // If folder changed, update folder path
      if (folderId !== undefined && folderId !== currentFolder) {
        setCurrentFolder(folderId);
        updateFolderPath(folderId);
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
      
      // Add timestamp to avoid name conflicts
      const fileName = `${Date.now()}-${sanitizedFilename}`;
      const fullPath = currentFolder 
        ? `${basePath}/${currentFolder}/${fileName}` 
        : `${basePath}/${fileName}`;
      
      console.log('Uploading file to bucket:', FILES_BUCKET);
      console.log('Path:', fullPath);
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(FILES_BUCKET)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      // Complete the upload
      setUploadProgress(100);
      toast({
        title: 'Success',
        description: `File ${file.name} uploaded successfully`,
      });
      
      // Reload files to see the new one
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
      const folderPath = currentFolder 
        ? `${basePath}/${currentFolder}/${folderName.trim()}/.folder.json` 
        : `${basePath}/${folderName.trim()}/.folder.json`;
      
      console.log('Creating folder in bucket:', FILES_BUCKET);
      console.log('Path:', folderPath);
      
      // Create a folder JSON file like in the original project
      const { error: folderError } = await supabase.storage
        .from(FILES_BUCKET)
        .upload(folderPath, JSON.stringify({ type: 'folder' }), {
          contentType: 'application/json',
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
  }, [loadFiles, setError, setIsLoading, supabase, toast, selectedFile]);
  
  // Select a file
  const selectFile = useCallback((file: FileObject | null) => {
    setSelectedFile(file);
  }, [setSelectedFile]);
  
  // Navigate into a folder
  const navigateToFolder = useCallback((folderId: string) => {
    loadFiles(folderId);
  }, [loadFiles]);
  
  // Navigate up one level
  const navigateUp = useCallback(() => {
    if (!currentFolder) return;
    const parts = currentFolder.split('/');
    const parentFolder = parts.slice(0, -1).join('/');
    loadFiles(parentFolder);
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