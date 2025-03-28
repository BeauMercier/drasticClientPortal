/**
 * Task Types
 * 
 * This file contains all task-related type definitions.
 */

import { Tables } from './dbHelpers';
import { ProjectType } from './project';

/**
 * Designer task type directly from database schema
 */
export type DesignerTask = Tables<'designer_tasks'>;

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Task status values
 */
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';

/**
 * Task list parameters for filtering
 */
export interface TaskListParams {
  designer_id?: string;
  project_id?: string;
  project_type?: ProjectType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date_start?: string;
  due_date_end?: string;
  limit?: number;
  offset?: number;
}

/**
 * Task creation parameters
 */
export interface CreateTaskParams {
  title: string;
  description?: string;
  designer_id: string;
  project_id?: string;
  project_type?: ProjectType;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

/**
 * Task update parameters
 */
export interface UpdateTaskParams {
  title?: string;
  description?: string;
  designer_id?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

/**
 * Task operation result
 */
export interface TaskResult {
  success: boolean;
  task?: DesignerTask;
  error?: string;
} 