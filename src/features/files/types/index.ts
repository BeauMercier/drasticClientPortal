/**
 * Files Types
 * 
 * Contains all types related to file operations.
 */

/**
 * Represents a file or folder
 */
export interface FileType {
  id: string;
  name: string;
  path: string;
  parent_path?: string;
  type?: string;
  size?: number;
  is_folder: boolean;
  url?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Result of a file operation
 */
export interface FileOperationResult {
  success: boolean;
  error?: string;
  file?: FileType;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  file: File;
  path: string;
  onProgress?: (progress: number) => void;
}

/**
 * Folder creation options
 */
export interface FolderCreationOptions {
  name: string;
  path: string;
}

/**
 * File storage context value
 */
export interface FileStorageContextValue {
  files: FileType[];
  currentPath: string;
  isLoading: boolean;
  error: string | null;
  setCurrentPath: (path: string) => void;
  refresh: () => Promise<void>;
  uploadFile: (options: FileUploadOptions) => Promise<FileOperationResult>;
  createFolder: (options: FolderCreationOptions) => Promise<FileOperationResult>;
  deleteFile: (path: string) => Promise<FileOperationResult>;
  getFileUrl: (path: string) => Promise<string | null>;
}

export interface FileSearchParams {
  path?: string;
  type?: string | string[];
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface FileOperation {
  success: boolean;
  error?: string;
  file?: FileType;
}

export interface FolderOperation {
  success: boolean;
  error?: string;
  folder?: FileType;
} 