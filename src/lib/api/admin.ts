/**
 * Admin API Module
 * 
 * This module provides administrative API functions for managing users, projects, 
 * and other resources. It uses the service role client to bypass RLS policies.
 */

import { createServiceRoleClient } from './server';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types/user';
import { ProjectType } from '@/lib/types/project';

// Define enum values directly without importing (to avoid import cycles)
export const UserRole = {
  ADMIN: 'admin',
  CLIENT: 'client',
  DESIGNER: 'designer',
  GUEST: 'guest',
  PARTNER: 'partner'
} as const;

export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export const ProjectStatus = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// Admin-specific client singleton
let adminClient: SupabaseClient | null = null;

/**
 * Retrieves a singleton instance of the Supabase client configured with the service role key.
 * This client bypasses Row Level Security (RLS).
 * @returns {SupabaseClient} The admin Supabase client instance.
 */
function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createServiceRoleClient();
  }
  return adminClient;
}

/**
 * Performs a basic check to verify that the admin client can connect to the database.
 * Attempts to count rows in the 'profiles' table.
 * @returns {Promise<{ success: boolean; error?: string; count?: number }>} 
 *          An object indicating success or failure, with an optional error message or row count.
 */
export const checkAdminClient = async (): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    const supabase = getAdminClient();
    
    // Try to count users as a simple test
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { 
        success: false, 
        error: `Database error: ${error.message}`
      };
    }
    
    return { 
      success: true,
      count: count || 0
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
};

/**
 * Lists all users by combining data from Supabase Auth and the 'profiles' table.
 * @returns {Promise<Array<object>>} An array of user objects containing combined auth and profile information.
 *          Shape: { id, email, role, full_name, company, created_at, last_sign_in_at, updated_at }
 * @throws {Error} If fetching users or profiles fails.
 */
export const listUsers = async () => {
  const supabase = getAdminClient();
  
  // First get auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    throw new Error(`Error fetching users: ${authError.message}`);
  }
  
  // Then get profile data
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    throw new Error(`Error fetching profiles: ${profilesError.message}`);
  }
  
  // Combine the data
  return authUsers.users.map(user => {
    const profile = profiles.find(p => p.id === user.id) || {};
    return {
      id: user.id,
      email: user.email || '',
      role: profile.role || UserRole.GUEST,
      full_name: profile.full_name || user.user_metadata?.full_name || '',
      company: profile.company || user.user_metadata?.company || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      updated_at: profile.updated_at
    };
  });
};

/**
 * Creates a new user in Supabase Auth and inserts a corresponding record in the 'profiles' table.
 * @param {object} params - User details.
 * @param {string} params.email - User's email address.
 * @param {string} params.password - User's password.
 * @param {string} params.role - User's role (e.g., 'client', 'designer', 'admin').
 * @param {string} [params.full_name] - User's full name.
 * @param {string} [params.company] - User's company name.
 * @returns {Promise<object>} An object representing the newly created user with combined auth/profile info.
 * @throws {Error} If creating the auth user or the profile fails.
 */
export const createUser = async (params: {
  email: string;
  password: string;
  role: string;
  full_name?: string;
  company?: string;
}) => {
  const supabase = getAdminClient();
  
  // Create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.full_name,
      company: params.company
    }
  });
  
  if (authError) {
    throw new Error(`Error creating user: ${authError.message}`);
  }
  
  const userId = authData.user.id;
  
  // Create the profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role: params.role,
      full_name: params.full_name,
      company: params.company,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (profileError) {
    // Attempt to delete the auth user since profile creation failed
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Error creating profile: ${profileError.message}`);
  }
  
  return {
    id: userId,
    email: params.email,
    role: profileData.role,
    full_name: profileData.full_name,
    company: profileData.company,
    created_at: authData.user.created_at,
    updated_at: profileData.updated_at
  };
};

/**
 * Updates a user's profile information in the 'profiles' table and their metadata in Supabase Auth.
 * @param {string} userId - The ID of the user to update.
 * @param {object} params - Fields to update.
 * @param {string} [params.role] - New role for the user.
 * @param {string} [params.full_name] - New full name for the user.
 * @param {string} [params.company] - New company name for the user.
 * @returns {Promise<void>}
 * @throws {Error} If updating the profile or user metadata fails.
 */
export const updateUser = async (userId: string, params: {
  role?: string;
  full_name?: string;
  company?: string;
}) => {
  const supabase = getAdminClient();
  
  // Update the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      ...(params.role && { role: params.role }),
      ...(params.full_name && { full_name: params.full_name }),
      ...(params.company && { company: params.company }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  
  if (profileError) {
    throw new Error(`Error updating profile: ${profileError.message}`);
  }
  
  // Update user metadata if name or company changed
  if (params.full_name || params.company) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }
    
    const currentMetadata = userData.user.user_metadata || {};
    const newMetadata = {
      ...currentMetadata,
      ...(params.full_name && { full_name: params.full_name }),
      ...(params.company && { company: params.company })
    };
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: newMetadata }
    );
    
    if (updateError) {
      throw new Error(`Error updating user metadata: ${updateError.message}`);
    }
  }
};

/**
 * Deletes a user from Supabase Auth. Associated profile data should be handled by database triggers or policies.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>}
 * @throws {Error} If deleting the user fails.
 */
export const deleteUser = async (userId: string) => {
  const supabase = getAdminClient();
  
  // Delete the user
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
  
  // The profile should be automatically deleted via DB triggers or RLS
};

/**
 * Fetches a specific user's profile from the 'profiles' table.
 * @param {string} userId - The ID of the user whose profile to fetch.
 * @returns {Promise<UserProfile | null>} The user's profile data or null if not found.
 * @throws {Error} If fetching the profile fails.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return null;
    }
    throw new Error(`Error fetching profile: ${error.message}`);
  }
  
  return data as UserProfile;
};

/**
 * Fetches all users with the 'designer' role from the 'profiles' table.
 * @returns {Promise<UserProfile[]>} An array of designer profiles.
 * @throws {Error} If fetching profiles fails.
 */
export const getDesigners = async (): Promise<UserProfile[]> => {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', UserRole.DESIGNER);
  
  if (error) {
    throw new Error(`Error fetching designers: ${error.message}`);
  }
  
  return data || [];
};

/**
 * Helper function to get the correct project table name based on the project type.
 * @param {ProjectType | string} projectType - The type of the project (e.g., 'web_design').
 * @returns {string} The corresponding table name (e.g., 'web_design_projects').
 * @throws {Error} If the project type is unsupported.
 */
const getProjectTableName = (projectType: ProjectType | string): string => {
  switch (projectType) {
    case 'web_design': return 'web_design_projects';
    case 'logo_design': return 'logo_design_projects';
    case 'social_graphics': return 'social_graphics_projects';
    default: 
      throw new Error(`Unsupported project type: ${projectType}`);
  }
};

/**
 * Assigns a designer to a specific project by updating the project table.
 * @param {string} projectId - The ID of the project.
 * @param {string} designerId - The ID of the designer to assign.
 * @param {ProjectType | string} projectType - The type of the project.
 * @returns {Promise<void>}
 * @throws {Error} If the project type is invalid or the update fails.
 */
export const assignDesignerToProject = async (
  projectId: string,
  designerId: string,
  projectType: ProjectType | string
) => {
  const supabase = getAdminClient();
  const tableName = getProjectTableName(projectType);
  
  // Check if designer exists
  const { data: designerData, error: designerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', designerId)
    .eq('role', UserRole.DESIGNER)
    .single();
  
  if (designerError || !designerData) {
    throw new Error(`Designer not found or not a designer: ${designerId}`);
  }
  
  // Update the project
  const { data, error } = await supabase
    .from(tableName)
    .update({ designer_id: designerId })
    .eq('id', projectId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error assigning designer: ${error.message}`);
  }
  
  return data;
};

/**
 * Removes the assigned designer from a specific project by setting designer_id to null.
 * @param {string} projectId - The ID of the project.
 * @param {ProjectType | string} projectType - The type of the project.
 * @returns {Promise<void>}
 * @throws {Error} If the project type is invalid or the update fails.
 */
export const removeDesignerFromProject = async (
  projectId: string,
  projectType: ProjectType | string
) => {
  const supabase = getAdminClient();
  const tableName = getProjectTableName(projectType);
  
  // Update the project
  const { data, error } = await supabase
    .from(tableName)
    .update({ designer_id: null })
    .eq('id', projectId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error removing designer: ${error.message}`);
  }
  
  return data;
};

/**
 * Creates a new task for a designer.
 * @param {object} taskData - The details of the task.
 * @param {string} taskData.title - Task title.
 * @param {string} [taskData.description] - Task description.
 * @param {string} [taskData.status='todo'] - Task status.
 * @param {string} [taskData.priority='medium'] - Task priority.
 * @param {string} [taskData.due_date] - Task due date.
 * @param {string} taskData.designer_id - ID of the assigned designer.
 * @param {string} [taskData.project_id] - Optional associated project ID.
 * @param {ProjectType | string} [taskData.project_type] - Optional associated project type.
 * @returns {Promise<any>} The newly created task data (TODO: Define specific Task type).
 * @throws {Error} If inserting the task fails.
 */
export const createDesignerTask = async (taskData: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  designer_id: string;
  project_id?: string;
  project_type?: string;
}) => {
  const supabase = getAdminClient();
  
  // Check if designer exists
  const { data: designerData, error: designerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', taskData.designer_id)
    .eq('role', UserRole.DESIGNER)
    .single();
  
  if (designerError || !designerData) {
    throw new Error(`Designer not found or not a designer: ${taskData.designer_id}`);
  }
  
  // Create the task
  const { data, error } = await supabase
    .from('designer_tasks')
    .insert({
      title: taskData.title,
      description: taskData.description || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
      designer_id: taskData.designer_id,
      project_id: taskData.project_id || null,
      project_type: taskData.project_type || null
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating task: ${error.message}`);
  }
  
  return data;
};

/**
 * Updates an existing designer task.
 * @param {string} taskId - The ID of the task to update.
 * @param {object} updates - Fields to update.
 * @param {string} [updates.title] - New title.
 * @param {string | null} [updates.description] - New description.
 * @param {string} [updates.status] - New status.
 * @param {string} [updates.priority] - New priority.
 * @param {string | null} [updates.due_date] - New due date.
 * @returns {Promise<any>} The updated task data (TODO: Define specific Task type).
 * @throws {Error} If updating the task fails.
 */
export const updateDesignerTask = async (taskId: string, updates: {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
}) => {
  const supabase = getAdminClient();
  
  // Update the task
  const { data, error } = await supabase
    .from('designer_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating task: ${error.message}`);
  }
  
  return data;
};

/**
 * Deletes a specific designer task.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise<void>}
 * @throws {Error} If deleting the task fails.
 */
export const deleteDesignerTask = async (taskId: string) => {
  const supabase = getAdminClient();
  
  // Delete the task
  const { error } = await supabase
    .from('designer_tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) {
    throw new Error(`Error deleting task: ${error.message}`);
  }
};

// Export default admin client for convenience
export default getAdminClient(); 