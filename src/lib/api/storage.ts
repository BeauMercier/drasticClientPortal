/**
 * Supabase Storage Module
 * 
 * This module provides a standardized interface for interacting with Supabase Storage.
 * It includes functions for uploading, downloading, listing, and deleting files.
 */

import { createClient } from './client';
import { createServiceRoleClient } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
// Import Supabase storage types
import type { FileObject, Bucket } from '@supabase/storage-js'; 

// Default bucket for file storage
export const FILES_BUCKET = 'client-files';

/**
 * Options for Supabase Storage image transformations.
 * @see https://supabase.com/docs/guides/storage/image-transformations
 */
interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin'; // Note: Supabase docs mention 'origin', check if others are supported.
}

/**
 * Provides methods for interacting with Supabase Storage.
 * Can be instantiated with a regular client (for user operations)
 * or a service role client (for admin operations like bucket management).
 */
export class StorageService {
  private client: SupabaseClient;
  private isAdmin: boolean;

  /**
   * Creates a new StorageService instance.
   * @param {SupabaseClient} [client] - Optional Supabase client. Defaults to the standard client-side client.
   * @param {boolean} [isAdmin=false] - Indicates if the service instance has admin privileges.
   */
  constructor(client?: SupabaseClient, isAdmin: boolean = false) {
    this.client = client || createClient();
    this.isAdmin = isAdmin;
  }

  /**
   * Creates a new StorageService instance with admin privileges (using service role client).
   * This method includes checks to prevent usage in client-side code.
   * 
   * **Warning:** Should only be used in server-side code (API routes, server components).
   * @returns {StorageService} An admin-privileged StorageService instance.
   */
  static createAdminService(): StorageService {
    if (typeof window !== 'undefined') {
      console.warn('Admin storage service should not be used in browser environment');
      // Return a regular client in the browser to prevent errors
      return new StorageService(createClient(), false);
    }
    
    try {
      // This is safe because we checked for window above, ensuring this only runs server-side
      return new StorageService(createServiceRoleClient(), true);
    } catch (error) {
      console.error('Failed to create admin storage service:', error);
      // Fallback to regular client with warning
      return new StorageService(createClient(), false);
    }
  }

  /**
   * Gets a reference to a Supabase Storage bucket.
   * @param {string} bucketName - The name of the bucket.
   * @returns {ReturnType<SupabaseClient['storage']['from']>} A Supabase storage bucket reference.
   */
  getBucket(bucketName: string) {
    return this.client.storage.from(bucketName);
  }

  /**
   * Creates a new storage bucket. Requires admin privileges.
   * @param {string} bucketName - The name of the bucket to create.
   * @param {boolean} [isPublic=false] - Whether the bucket should allow public access.
   * @returns {Promise<ReturnType<SupabaseClient['storage']['createBucket']>>} The result of the bucket creation operation (inferred type).
   * @throws {Error} If the service instance does not have admin privileges or if the Supabase API call fails.
   */
  async createBucket(bucketName: string, isPublic: boolean = false) {
    if (!this.isAdmin) {
      throw new Error('Only admin services can create buckets');
    }
    // Let return type be inferred from Supabase SDK
    return this.client.storage.createBucket(bucketName, { public: isPublic });
  }

  /**
   * Deletes a storage bucket. Requires admin privileges.
   * @param {string} bucketName - The name of the bucket to delete.
   * @returns {Promise<ReturnType<SupabaseClient['storage']['deleteBucket']>>} The result of the bucket deletion operation (inferred type).
   * @throws {Error} If the service instance does not have admin privileges or if the Supabase API call fails.
   */
  async deleteBucket(bucketName: string) {
    if (!this.isAdmin) {
      throw new Error('Only admin services can delete buckets');
    }
    // Let return type be inferred from Supabase SDK
    return this.client.storage.deleteBucket(bucketName);
  }

  /**
   * Uploads a file to a specified bucket and path.
   * @param {string} bucketName - The name of the target bucket.
   * @param {string} filePath - The full path where the file will be stored (e.g., 'folder/subfolder/file.png').
   * @param {File | Blob | ArrayBuffer} fileData - The file content to upload.
   * @param {object} [options] - Optional upload parameters.
   * @param {string} [options.cacheControl='3600'] - Cache control header for the file.
   * @param {string} [options.contentType] - Mime type of the file. If omitted, Supabase attempts to detect it.
   * @param {boolean} [options.upsert=false] - If true, replaces the file if it already exists.
   * @returns {Promise<{ data: { path: string } | null; error: Error | null }>} The result of the upload operation.
   * @throws {Error} If the Supabase API call fails.
   */
  async uploadFile(bucketName: string, filePath: string, fileData: File | Blob | ArrayBuffer, options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }): Promise<{ data: { path: string } | null; error: Error | null }> {
    const bucket = this.getBucket(bucketName);
    // Use Supabase return type directly
    return bucket.upload(filePath, fileData, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });
  }

  /**
   * Downloads a file from a bucket.
   * @param {string} bucketName - The name of the bucket.
   * @param {string} filePath - The path of the file to download.
   * @returns {Promise<{ data: Blob | null; error: Error | null }>} The file content as a Blob or an error.
   * @throws {Error} If the Supabase API call fails.
   */
  async downloadFile(bucketName: string, filePath: string): Promise<{ data: Blob | null; error: Error | null }> {
    const bucket = this.getBucket(bucketName);
    // Use Supabase return type directly
    return bucket.download(filePath);
  }

  /**
   * Gets the public URL for a file in a bucket.
   * Note: The bucket must be configured for public access, or this URL won't work without a signed token.
   * @param {string} bucketName - The name of the bucket.
   * @param {string} filePath - The path of the file.
   * @param {object} [options] - URL generation options.
   * @param {boolean | string} [options.download] - If true, sets Content-Disposition header for download. If string, uses string as filename.
   * @param {TransformOptions} [options.transform] - Image transformation options.
   * @returns {string} The public URL for the file.
   */
  getPublicUrl(bucketName: string, filePath: string, options?: {
    download?: boolean | string;
    transform?: TransformOptions;
  }): string {
    const bucket = this.getBucket(bucketName);
    const { data } = bucket.getPublicUrl(filePath, options);
    return data.publicUrl;
  }

  /**
   * Lists files within a specific bucket, optionally filtering by path prefix.
   * @param {string} bucketName - The name of the bucket.
   * @param {string} [path] - Optional path prefix to limit the listing (e.g., 'folder/subfolder/').
   * @returns {Promise<FileObject[]>} An array of file objects.
   * @throws {Error} If the Supabase API call fails.
   */
  async listFiles(bucketName: string, path?: string): Promise<FileObject[]> {
    const bucket = this.getBucket(bucketName);
    const { data, error } = await bucket.list(path, {
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    return data || []; // Ensure array return
  }

  /**
   * Deletes one or more files from a bucket.
   * @param {string} bucketName - The name of the bucket.
   * @param {string[]} filePaths - An array of file paths to delete.
   * @returns {Promise<{ data: FileObject[] | null; error: Error | null }>} Result containing deleted file info or error.
   * @throws {Error} If the Supabase API call fails.
   */
  async deleteFiles(bucketName: string, filePaths: string[]): Promise<{ data: FileObject[] | null; error: Error | null }> {
    const bucket = this.getBucket(bucketName);
    // Use Supabase return type directly
    return bucket.remove(filePaths);
  }

  /**
   * Moves a file from one path to another within the same bucket.
   * @param {string} bucketName - The name of the bucket.
   * @param {string} fromPath - The current path of the file.
   * @param {string} toPath - The desired new path of the file.
   * @returns {Promise<{ data: { message: string } | null; error: Error | null }>} Result message or error.
   * @throws {Error} If the Supabase API call fails.
   */
  async moveFile(bucketName: string, fromPath: string, toPath: string): Promise<{ data: { message: string } | null; error: Error | null }> {
    const bucket = this.getBucket(bucketName);
    // Use Supabase return type directly
    return bucket.move(fromPath, toPath);
  }
}

// Create a default client-side instance
const storageService = new StorageService();

// Export the instance as default for convenience
/** Default instance of StorageService for client-side usage. */
export default storageService;

// Export a function to create an admin service
/** Factory function to create an admin-privileged StorageService instance (server-side only). */
export const createAdminStorageService = StorageService.createAdminService; 