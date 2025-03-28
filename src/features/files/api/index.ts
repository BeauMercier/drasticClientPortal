/**
 * Files API Module
 * 
 * Contains all API functions related to file operations.
 */

import { FileType, FileOperationResult } from '../types';
import { supabase } from '../../../shared/services/supabase';

// Helper function to adapt storage service file object to our FileType
function adaptFileObject(file: Record<string, unknown>): FileType {
  return {
    id: (file.id as string) || (file.path as string),
    name: file.name as string,
    path: (file.path as string) || (file.name as string),
    parent_path: file.file_path as string,
    type: (file.mediaType as string) || (file.contentType as string) || 'application/octet-stream',
    size: typeof file.size === 'string' ? parseInt(file.size, 10) : (file.size as number) || 0,
    is_folder: (file.is_folder as boolean) || false,
    url: (file.url as string) || undefined,
    created_at: (file.created_at as string) || new Date().toISOString(),
    updated_at: file.updated_at as string
  };
}

/**
 * List files in a directory
 */
export async function listFiles(path: string): Promise<FileType[]> {
  try {
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    
    const { data } = await supabase
      .from('user_files')
      .select('*')
      .eq('file_path', formattedPath)
      .order('name', { ascending: true });
    
    return (data || []).map(adaptFileObject);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Create a new folder
 */
export async function createFolder(path: string, name: string): Promise<FileOperationResult> {
  try {
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    const folderPath = `${formattedPath}/${name}`.replace(/\/\//g, '/');
    
    const { data } = await supabase
      .from('user_files')
      .select('*')
      .eq('path', folderPath)
      .limit(1);
    
    if (data && data.length > 0) {
      return {
        success: false,
        error: 'A folder with this name already exists'
      };
    }
    
    const { error: createError } = await supabase
      .from('user_files')
      .insert({
        name,
        path: folderPath,
        file_path: formattedPath,
        is_folder: true,
        created_at: new Date().toISOString()
      });
    
    if (createError) {
      return {
        success: false,
        error: createError.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder'
    };
  }
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<FileOperationResult> {
  try {
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    const filePath = `${formattedPath}/${file.name}`.replace(/\/\//g, '/');
    
    // Upload file to storage
    const { error: uploadError } = await supabase
      .from('user_files')
      .insert({
        name: file.name,
        path: filePath,
        file_path: formattedPath,
        size: file.size,
        type: file.type,
        is_folder: false,
        created_at: new Date().toISOString()
      });
    
    if (uploadError) {
      return {
        success: false,
        error: uploadError.message
      };
    }
    
    // Call progress callback
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

/**
 * Delete a file or folder
 */
export async function deleteFile(path: string): Promise<FileOperationResult> {
  try {
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // First check if it's a folder
    const { data, error: checkError } = await supabase
      .from('user_files')
      .select('is_folder')
      .eq('path', formattedPath)
      .limit(1);
    
    if (checkError) {
      return {
        success: false,
        error: checkError.message
      };
    }
    
    const isFolder = data && data[0] && data[0].is_folder;
    
    if (isFolder) {
      // Delete all children first
      const { error: deleteChildrenError } = await supabase
        .from('user_files')
        .delete()
        .eq('file_path', formattedPath);
      
      if (deleteChildrenError) {
        return {
          success: false,
          error: deleteChildrenError.message
        };
      }
    }
    
    // Delete the file or folder
    const { error: deleteError } = await supabase
      .from('user_files')
      .delete()
      .eq('path', formattedPath);
    
    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

/**
 * Get a public URL for a file
 */
export async function getFileUrl(path: string): Promise<string | null> {
  try {
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    
    const { data, error } = await supabase
      .from('user_files')
      .select('url')
      .eq('path', formattedPath)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    // Create a signed URL
    return data[0].url || null;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}

/**
 * Initialize storage for a new user
 */
export async function initStorage(userId: string): Promise<FileOperationResult> {
  try {
    // Create root folders
    const rootFolders = ['Documents', 'Images', 'Shared'];
    
    for (const folder of rootFolders) {
      const { error } = await supabase
        .from('user_files')
        .insert({
          name: folder,
          path: `${userId}/${folder}`,
          file_path: userId,
          is_folder: true,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        return {
          success: false,
          error: `Failed to create ${folder} folder: ${error.message}`
        };
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error initializing storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize storage'
    };
  }
} 