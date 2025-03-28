/**
 * useProjects Hook
 * 
 * Custom hook for managing projects
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Project, 
  ProjectListParams,
  ProjectMember
} from '../types';
import { supabase } from '../../../shared/services/supabase';
import { useAuth } from '../../../features/auth/hooks/useAuth';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  loadProjects: (queryParams?: ProjectListParams) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  loadProjectMembers: (projectId: string) => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'created_at'>) => Promise<Project>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addProjectMember: (projectId: string, userId: string, role: string) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  const { user } = useAuth();

  // Load projects
  const loadProjects = useCallback(async (queryParams?: ProjectListParams) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query
      let query = supabase.from('projects').select('*');
      
      // Apply filters
      if (queryParams?.status) {
        query = query.eq('status', queryParams.status);
      }
      
      if (queryParams?.client_id) {
        query = query.eq('client_id', queryParams.client_id);
      }
      
      // Default to user's projects
      if (!queryParams?.client_id) {
        query = query.eq('client_id', user.id);
      }
      
      // Apply limit
      if (queryParams?.limit) {
        query = query.limit(queryParams.limit);
      }
      
      // Apply ordering
      if (queryParams?.sortBy) {
        query = query.order(
          queryParams.sortBy, 
          queryParams.sortOrder || { ascending: false }
        );
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      // Execute query
      const { data, error: queryError } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load a single project
  const loadProject = useCallback(async (projectId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (queryError) {
        throw queryError;
      }
      
      if (!data) {
        throw new Error('Project not found');
      }
      
      setCurrentProject(data);
    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load project members
  const loadProjectMembers = useCallback(async (projectId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          project_id,
          role,
          added_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId);
      
      if (queryError) {
        throw queryError;
      }
      
      setProjectMembers(data || []);
    } catch (err: any) {
      console.error('Error loading project members:', err);
      setError(err.message || 'Failed to load project members');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new project
  const createProject = useCallback(async (data: Omit<Project, 'id' | 'created_at'>) => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data
      const projectData = {
        ...data,
        client_id: user.id,
        created_at: new Date().toISOString()
      };
      
      // Create project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      if (!newProject) {
        throw new Error('Failed to create project');
      }
      
      // Update state
      setProjects(prevProjects => [...prevProjects, newProject]);
      
      return newProject;
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update a project
  const updateProject = useCallback(async (projectId: string, data: Partial<Project>) => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update the project
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      if (!updatedProject) {
        throw new Error('Project not found');
      }
      
      // Update state
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? updatedProject : p)
      );
      
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      
      return updatedProject;
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message || 'Failed to update project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentProject?.id]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete the project
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Update state
      setProjects(prevProjects => 
        prevProjects.filter(p => p.id !== projectId)
      );
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentProject?.id]);

  // Add a member to a project
  const addProjectMember = useCallback(async (projectId: string, userId: string, role: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add the member
      const { error: addError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role,
          added_at: new Date().toISOString()
        });
      
      if (addError) {
        throw addError;
      }
      
      // Reload members
      await loadProjectMembers(projectId);
    } catch (err: any) {
      console.error('Error adding project member:', err);
      setError(err.message || 'Failed to add project member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadProjectMembers]);

  // Remove a member from a project
  const removeProjectMember = useCallback(async (projectId: string, userId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove the member
      const { error: removeError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      
      if (removeError) {
        throw removeError;
      }
      
      // Update state
      setProjectMembers(prevMembers => 
        prevMembers.filter(m => !(m.project_id === projectId && m.user_id === userId))
      );
    } catch (err: any) {
      console.error('Error removing project member:', err);
      setError(err.message || 'Failed to remove project member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    error,
    currentProject,
    projectMembers,
    loadProjects,
    loadProject,
    loadProjectMembers,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    removeProjectMember
  };
} 