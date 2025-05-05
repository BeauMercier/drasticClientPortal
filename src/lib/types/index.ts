/**
 * Types Barrel File
 * 
 * This file exports all types from a central location to make imports cleaner.
 * Import types from here rather than from individual files.
 */

// Export database helper types
export type {
  Tables,
  InsertTables,
  UpdateTables,
  Enums,
  ProjectTableName,
  ProjectRow,
  TableRelationships,
  TypedQueryBuilder
} from './dbHelpers';

// Export domain-specific types
export * from './user';
export * from './project';
export * from './task';
export * from './file';
export * from './billing';
export * from './support';
export * from './common';
// export * from './api'; // Removed: Causes duplicate exports (ApiResponse, ProjectStatus, etc.)
export * from './bir';

// Re-export database types for convenience
export type { Database } from '@/lib/database.types'; 