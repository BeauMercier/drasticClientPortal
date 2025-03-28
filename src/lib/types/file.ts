/**
 * File storage types
 */

/**
 * File object representing a file in storage
 */
export interface FileObject {
  id: string;
  name: string;
  fullPath: string;
  bucketId: string;
  isFolder: boolean;
  size?: number;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAccessed?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Folder path segment for navigation
 */
export interface FolderPath {
  id: string;
  name: string;
  isRoot?: boolean;
}

/**
 * File operation result
 */
export interface FileResult {
  success: boolean;
  file?: FileObject;
  error?: string;
}

/**
 * File list result
 */
export interface FileListResult {
  success: boolean;
  files: FileObject[];
  error?: string;
  currentFolder?: string;
  folderPath?: FolderPath[];
}

/**
 * File upload parameters
 */
export interface FileUploadParams {
  file: File;
  folderPath?: string;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
}

/**
 * File download parameters
 */
export interface FileDownloadParams {
  fileId: string;
  fileName?: string;
}

/**
 * Storage bucket types
 */
export type StorageBucket = 'project-files' | 'user-uploads' | 'portfolio' | 'system';

/**
 * Access level for files
 */
export type FileAccessLevel = 'public' | 'private' | 'shared'; 