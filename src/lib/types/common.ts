/**
 * Common Types
 * 
 * This file contains common type definitions used across multiple modules.
 */

// Standard status types
export type StatusType = 'active' | 'inactive' | 'pending' | 'archived';

/**
 * Common utility types used across the application
 */

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic list response with pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic list parameters
 */
export interface ListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * React node type (useful for components)
 */
export type ReactNode = React.ReactNode;

/**
 * Generic entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Result with a single entity
 */
export interface EntityResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Function that accepts any arguments and returns any value
 * Used for callbacks, event handlers, etc.
 */
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Deep partial utility type - makes all properties and nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type-safe string record
 */
export type StringRecord = Record<string, string>;

/**
 * Type-safe key-value record using unknown for values instead of any
 */
export type KeyValueRecord = Record<string, unknown>; 