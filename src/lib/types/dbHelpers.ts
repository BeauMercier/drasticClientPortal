import type { Database } from '@/lib/database.types';

/**
 * Helper type to access Row type of a table
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type to access Insert type of a table
 */
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Helper type to access Update type of a table
 */
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/**
 * Helper type to access enum values
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

/**
 * Helper type for project tables that are dynamically referenced
 */
export type ProjectTableName = 
  | 'web_design_projects' 
  | 'logo_design_projects' 
  | 'social_graphics_projects';

/**
 * Helper type for getting project row type from any project table
 */
export type ProjectRow<T extends ProjectTableName> = 
  Database['public']['Tables'][T]['Row'];

/**
 * Helper type for profiles table row
 */
export type Profile = Tables<'profiles'>;

/**
 * Helper type for extracting relationships from a table
 */
export type TableRelationships<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Relationships'];

/**
 * Helper function type for creating a type-safe query builder
 */
export type TypedQueryBuilder<T extends keyof Database['public']['Tables']> = {
  table: T;
  select: <C extends keyof Tables<T>>(columns?: C[] | '*') => Promise<Tables<T>[]>;
  insert: (data: InsertTables<T>) => Promise<Tables<T>>;
  update: (data: UpdateTables<T>) => Promise<Tables<T>>;
}; 