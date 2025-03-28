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
 * Get the admin client instance
 * Using a singleton pattern for efficiency
 */
function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createServiceRoleClient();
  }
  return adminClient;
}

/**
 * Check if the admin client is working properly
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
 * List all users with their profile information
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
 * Create a new user with profile
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
 * Update a user's profile
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
 * Delete a user and their profile
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
 * Get a user's profile
 */
export const getUserProfile = async (userId: string) => {
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
 * Get designers (users with designer role)
 */
export const getDesigners = async () => {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', UserRole.DESIGNER);
  
  if (error) {
    throw new Error(`Error fetching designers: ${error.message}`);
  }
  
  return data;
};

/**
 * Helper function to get the correct table name for a project type
 */
const getProjectTableName = (projectType: string): string => {
  switch (projectType) {
    case 'web_design': return 'web_design_projects';
    case 'logo_design': return 'logo_design_projects';
    case 'social_graphics': return 'social_graphics_projects';
    default: 
      throw new Error(`Unsupported project type: ${projectType}`);
  }
};

/**
 * Assign a designer to a project
 */
export const assignDesignerToProject = async (
  projectId: string,
  designerId: string,
  projectType: string
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
 * Remove a designer from a project
 */
export const removeDesignerFromProject = async (
  projectId: string,
  projectType: string
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
 * Create a designer task
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
 * Update a designer task
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
 * Delete a designer task
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