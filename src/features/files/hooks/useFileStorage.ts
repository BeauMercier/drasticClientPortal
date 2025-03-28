/**
 * useFileStorage Hook
 * 
 * Custom hook for managing file storage operations
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  FileType, 
  FileOperationResult, 
  FileUploadOptions, 
  FolderCreationOptions 
} from '../types';
import { 
  listFiles as apiListFiles, 
  createFolder as apiCreateFolder,
  uploadFile as apiUploadFile,
  deleteFile as apiDeleteFile,
  getFileUrl as apiGetFileUrl
} from '../api';

export function useFileStorage(initialPath: string = '') {
  const [files, setFiles] = useState<FileType[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch files when path changes
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedFiles = await apiListFiles(currentPath);
      setFiles(fetchedFiles);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath]);

  // Initial load and refresh when path changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Create a new folder
  const createFolder = async (options: FolderCreationOptions): Promise<FileOperationResult> => {
    setError(null);
    
    try {
      const result = await apiCreateFolder(options.path, options.name);
      
      if (result.success) {
        // Refresh the file list if we're in the same directory
        if (options.path === currentPath) {
          fetchFiles();
        }
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Failed to create folder';
      setError(errorMessage);
      console.error(errorMessage, err);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Upload a file
  const uploadFile = async (options: FileUploadOptions): Promise<FileOperationResult> => {
    setError(null);
    
    try {
      const result = await apiUploadFile(options.path, options.file, options.onProgress);
      
      if (result.success) {
        // Refresh the file list if we're in the same directory
        if (options.path === currentPath) {
          fetchFiles();
        }
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Failed to upload file';
      setError(errorMessage);
      console.error(errorMessage, err);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Delete a file or folder
  const deleteFile = async (path: string): Promise<FileOperationResult> => {
    setError(null);
    
    try {
      const result = await apiDeleteFile(path);
      
      if (result.success) {
        // Refresh the file list
        fetchFiles();
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Failed to delete file';
      setError(errorMessage);
      console.error(errorMessage, err);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Get a public URL for a file
  const getFileUrl = async (path: string): Promise<string | null> => {
    try {
      return await apiGetFileUrl(path);
    } catch (err) {
      console.error('Error getting file URL:', err);
      return null;
    }
  };

  return {
    files,
    currentPath,
    isLoading,
    error,
    setCurrentPath,
    refresh: fetchFiles,
    uploadFile,
    createFolder,
    deleteFile,
    getFileUrl
  };
} 