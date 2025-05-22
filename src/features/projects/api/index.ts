/**
 * Projects API Module
 * 
 * Contains all API functions related to project operations.
 */

import { 
  Project, 
  ProjectMember, 
  ProjectResult, 
  ProjectCreateParams, 
  UpdateProjectData,
  ProjectListParams,
  // ProjectStatus
} from '../types';
import { supabase } from '@/lib/api';
// import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
// import { TableRow, Tables } from '@/lib/api/schema';

/**
 * Get a list of projects
 */
export async function getProjects(params?: ProjectListParams): Promise<Project[]> {
  try {
    // Get user ID for user-specific queries
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Default to the current user's projects if no owner specified
    // const userId = (params?.client_id || user.id);
    
    // Start the base query
    let query = supabase
      .from('projects')
      .select('*');
    
    // Apply filters based on params
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    
    // Filter by client_id (owner)
    if (params?.client_id) {
      query = query.eq('client_id', params.client_id);
    } else {
      query = query.eq('client_id', user.id);
    }
    
    // Apply sorting
    const sortField = params?.sortBy || 'created_at';
    const sortOrder = params?.sortOrder || { ascending: false };
    query = query.order(sortField, sortOrder);
    
    // Apply pagination if specified
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    // Transform the data to ensure it matches the Project type
    return (data || []).map(item => ({
      id: item.id,
      name: item.name || 'Untitled Project',
      description: item.description || '',
      status: item.status || 'draft',
      created_at: item.created_at,
      updated_at: item.updated_at,
      client_id: item.client_id,
      // Add any other fields from the database
      ...item
    }));
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error('Error fetching project:', error);
      return null;
    }
    
    // Transform the data to match our types
    const project: Project = {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      client_id: data.client_id,
      metadata: data.metadata
    };
    
    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectCreateParams): Promise<ProjectResult> {
  try {
    const { name, description, client_id, status = 'draft', metadata } = data;
    
    // Get the current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // Create the project
    const { data: projectData, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        status,
        client_id: client_id,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Check if projectData is null
    if (!projectData) {
      return {
        success: false,
        error: 'Failed to retrieve created project data'
      };
    }
    
    // Transform the data to match our types with proper typing
    const project: Project = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      created_at: projectData.created_at,
      updated_at: projectData.updated_at,
      client_id: projectData.client_id,
      metadata: projectData.metadata
    };
    
    return {
      success: true,
      project
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project'
    };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string, 
  data: UpdateProjectData
): Promise<ProjectResult> {
  try {
    const { name, description, status, clientId, metadata } = data;
    
    // Get the current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // First check if the user has permission
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .limit(1)
      .single();
    
    if (fetchError || !projectData) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    // Only allow owners to update projects
    if (projectData.client_id !== userId) {
      return {
        success: false,
        error: 'You do not have permission to update this project'
      };
    }
    
    // Update the project
    const updateData: Partial<Project> = {
      updated_at: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (clientId !== undefined) updateData.client_id = clientId;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    const { data: _updatedData, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get the updated project
    return await getProjectResult(projectId);
  } catch (error) {
    console.error('Error updating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project'
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<ProjectResult> {
  try {
    // Get the current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // First check if the user has permission
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .limit(1)
      .single();
    
    if (fetchError || !projectData) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    // Only allow owners to delete projects
    if (projectData.client_id !== userId) {
      return {
        success: false,
        error: 'You do not have permission to delete this project'
      };
    }
    
    // Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project'
    };
  }
}

/**
 * Get project members
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, users(id, email, full_name, avatar_url)')
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Error fetching project members:', error);
      return [];
    }
    
    // Transform the data to match our types
    const members: ProjectMember[] = data.map((item) => ({
      user_id: item.user_id,
      project_id: item.project_id,
      role: item.role,
      added_at: item.added_at,
      user: {
        id: item.users?.id,
        email: item.users?.email,
        full_name: item.users?.full_name,
        avatar_url: item.users?.avatar_url
      }
    }));
    
    return members;
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectId: string, 
  email: string, 
  role: string
): Promise<ProjectResult> {
  try {
    // Get the current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // First check if the user has permission
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .limit(1)
      .single();
    
    if (fetchError || !projectData) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    // Only allow owners to add members
    if (projectData.client_id !== userId) {
      return {
        success: false,
        error: 'You do not have permission to add members to this project'
      };
    }
    
    // Get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();
    
    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Add the member
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userData.id,
        role,
        added_at: new Date().toISOString()
      });
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error adding project member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add project member'
    };
  }
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string, 
  userId: string
): Promise<ProjectResult> {
  try {
    // Get the current user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    
    if (!currentUserId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // First check if the user has permission
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .limit(1)
      .single();
    
    if (fetchError || !projectData) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    // Only allow owners to remove members (or users to remove themselves)
    if (projectData.client_id !== currentUserId && userId !== currentUserId) {
      return {
        success: false,
        error: 'You do not have permission to remove this member'
      };
    }
    
    // Remove the member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error removing project member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove project member'
    };
  }
}

// Helper function to get a project result
async function getProjectResult(projectId: string): Promise<ProjectResult> {
  const project = await getProject(projectId);
  
  if (!project) {
    return {
      success: false,
      error: 'Project not found'
    };
  }
  
  return {
    success: true,
    project
  };
} 