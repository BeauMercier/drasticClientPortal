/**
 * Supabase Storage Module
 * 
 * This module provides a standardized interface for interacting with Supabase Storage.
 * It includes functions for uploading, downloading, listing, and deleting files.
 */

import { createClient } from './client';
import { createServiceRoleClient } from './server';
import { SupabaseClient } from '@supabase/supabase-js';

// Default bucket for file storage
export const FILES_BUCKET = 'project-files';

// Define transform options type for image transformations
interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin';
}

/**
 * StorageService class for managing file operations
 */
export class StorageService {
  private client: SupabaseClient;
  private isAdmin: boolean;

  /**
   * Create a new StorageService instance
   * @param client Optional Supabase client, defaults to the standard client
   * @param isAdmin Whether this service has admin privileges
   */
  constructor(client?: SupabaseClient, isAdmin: boolean = false) {
    this.client = client || createClient();
    this.isAdmin = isAdmin;
  }

  /**
   * Create a new admin StorageService instance
   * This should only be used in API routes or server components
   * 
   * WARNING: Do not use this method in client components!
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
   * Get a storage bucket
   * @param bucketName The name of the bucket
   */
  getBucket(bucketName: string) {
    return this.client.storage.from(bucketName);
  }

  /**
   * Create a new storage bucket (admin only)
   * @param bucketName The name of the bucket to create
   * @param isPublic Whether the bucket should be public
   */
  async createBucket(bucketName: string, isPublic: boolean = false) {
    if (!this.isAdmin) {
      throw new Error('Only admin services can create buckets');
    }

    const { data, error } = await this.client.storage.createBucket(bucketName, {
      public: isPublic,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete a storage bucket (admin only)
   * @param bucketName The name of the bucket to delete
   */
  async deleteBucket(bucketName: string) {
    if (!this.isAdmin) {
      throw new Error('Only admin services can delete buckets');
    }

    const { error } = await this.client.storage.deleteBucket(bucketName);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Upload a file to a bucket
   * @param bucketName The name of the bucket
   * @param filePath The path to store the file at
   * @param fileData The file data (File, Blob or ArrayBuffer)
   * @param options Upload options
   */
  async uploadFile(bucketName: string, filePath: string, fileData: File | Blob | ArrayBuffer, options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }) {
    const bucket = this.getBucket(bucketName);

    const { data, error } = await bucket.upload(filePath, fileData, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType,
      upsert: options?.upsert || false,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Download a file from a bucket
   * @param bucketName The name of the bucket
   * @param filePath The path of the file
   */
  async downloadFile(bucketName: string, filePath: string) {
    const bucket = this.getBucket(bucketName);

    const { data, error } = await bucket.download(filePath);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get a public URL for a file
   * @param bucketName The name of the bucket
   * @param filePath The path of the file
   * @param options URL options
   */
  getPublicUrl(bucketName: string, filePath: string, options?: {
    download?: boolean | string;
    transform?: TransformOptions;
  }) {
    const bucket = this.getBucket(bucketName);
    const { data } = bucket.getPublicUrl(filePath, options);
    return data.publicUrl;
  }

  /**
   * List all files in a bucket or directory
   * @param bucketName The name of the bucket
   * @param path Optional path prefix to filter by
   */
  async listFiles(bucketName: string, path?: string) {
    const bucket = this.getBucket(bucketName);

    const { data, error } = await bucket.list(path, {
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete files from a bucket
   * @param bucketName The name of the bucket
   * @param filePaths Array of file paths to delete
   */
  async deleteFiles(bucketName: string, filePaths: string[]) {
    const bucket = this.getBucket(bucketName);

    const { data, error } = await bucket.remove(filePaths);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Move a file within a bucket
   * @param bucketName The name of the bucket
   * @param fromPath The current file path
   * @param toPath The destination file path
   */
  async moveFile(bucketName: string, fromPath: string, toPath: string) {
    const bucket = this.getBucket(bucketName);

    const { data, error } = await bucket.move(fromPath, toPath);

    if (error) {
      throw error;
    }

    return data;
  }
}

// Export a default client-side instance for convenience
export default new StorageService();

// Export a function to create an admin service
export const createAdminStorageService = StorageService.createAdminService; 