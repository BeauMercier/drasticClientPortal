/**
 * Basic Project interface used across the application
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: string;
  [key: string]: any; // Allow additional properties
} 