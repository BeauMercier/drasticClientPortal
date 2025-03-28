/**
 * Database Schema Type Definitions
 *
 * This file contains type definitions for the Supabase database tables
 * to provide better type safety and autocomplete throughout the application.
 */

export type Tables = {
  projects: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    client_id: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, any> | null;
  };
  
  project_members: {
    project_id: string;
    user_id: string;
    role: string;
    added_at: string;
  };
  
  users: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    updated_at: string | null;
    created_at: string;
  };
  
  // Add other tables as needed
};

// Type-safe helpers for type extraction
export type TableRow<T extends keyof Tables> = Tables[T];
export type InsertRow<T extends keyof Tables> = Omit<Tables[T], 'id' | 'created_at' | 'updated_at'>;
export type UpdateRow<T extends keyof Tables> = Partial<Omit<Tables[T], 'id' | 'created_at'>>; 