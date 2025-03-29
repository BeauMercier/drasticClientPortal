/**
 * Client API Module
 * 
 * This module provides client-side API functions for interacting with the Supabase backend.
 * It contains functions for managing user profiles, projects, and other resources.
 */

import { createClient } from './client';
import { 
  ProjectRevision, 
  RevisionFile, 
  ProjectTypeForRevision, 
  RevisionStatus,
  MockupType,
  ProjectNote,
  ProjectType
} from '@/lib/types/project';
import { BusinessProfile } from '@/lib/types/user';
import { FILES_BUCKET } from './storage';

/**
 * Fetches the profile for the currently authenticated user.
 * @returns {Promise<Tables<'profiles'> | null>} The user's profile data or null if not authenticated.
 * @throws {Error} If there's an error fetching the profile from Supabase.
 */
export const getUserProfile = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
  return data;
};

/**
 * Updates the profile for the currently authenticated user.
 * @param {Partial<Tables<'profiles'>} updates - An object containing the profile fields to update.
 * @returns {Promise<Tables<'profiles'>} The updated user profile data.
 * @throws {Error} If the user is not authenticated or if there's an error updating the profile.
 */
export const updateUserProfile = async (updates: Partial<{ 
  full_name: string;
  business_name: string;
  avatar_url: string;
  phone: string;
  company: string;
  mobile: string;
  preferred_contact: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  position: string;
  business_website: string;
}>) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Uploads a profile picture file to Supabase Storage and updates the user's avatar_url.
 * @param {File} file - The image file to upload.
 * @returns {Promise<Tables<'profiles'>} The updated user profile data with the new avatar URL.
 * @throws {Error} If the user is not authenticated or if there's an error during upload or profile update.
 */
export const uploadProfilePicture = async (file: File) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar-${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/profile/${fileName}`;
  
  // Upload the file
  const { error: uploadError } = await supabase
    .storage
    .from(FILES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (uploadError) throw uploadError;
  
  // Get the public URL
  const { data: urlData } = await supabase
    .storage
    .from(FILES_BUCKET)
    .getPublicUrl(filePath);
  
  // Update profile with new avatar URL
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)
    .select()
    .single();
  
  if (profileError) throw profileError;
  
  return profileData;
};

/**
 * Fetches all web design projects associated with the current user.
 * @returns {Promise<Tables<'web_design_projects'>[] | null>} A list of web design projects or null.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getUserWebDesignProjects = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('web_design_projects')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  return data;
};

/**
 * Fetches a specific web design project by its ID.
 * @param {string} projectId - The ID of the project to fetch.
 * @returns {Promise<Tables<'web_design_projects'> | null>} The project data or null if not found.
 * @throws {Error} If there's a fetch error.
 */
export const getWebDesignProject = async (projectId: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('web_design_projects')
    .select('*')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Fetches all social graphics projects associated with the current user.
 * @returns {Promise<Tables<'social_graphics_projects'>[] | null>} A list of social graphics projects or null.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getUserSocialGraphicsProjects = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('social_graphics_projects')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  return data;
};

/**
 * Fetches a specific social graphics project by its ID.
 * @param {string} projectId - The ID of the project to fetch.
 * @returns {Promise<Tables<'social_graphics_projects'> | null>} The project data or null if not found.
 * @throws {Error} If there's a fetch error.
 */
export const getSocialGraphicsProject = async (projectId: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('social_graphics_projects')
    .select('*')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Fetches all logo design projects associated with the current user.
 * @returns {Promise<Tables<'logo_design_projects'>[] | null>} A list of logo design projects or null.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getUserLogoDesignProjects = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('logo_design_projects')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  return data;
};

/**
 * Fetches a specific logo design project by its ID.
 * @param {string} projectId - The ID of the project to fetch.
 * @returns {Promise<Tables<'logo_design_projects'> | null>} The project data or null if not found.
 * @throws {Error} If there's a fetch error.
 */
export const getLogoDesignProject = async (projectId: string) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('logo_design_projects')
    .select('*')
    .eq('id', projectId)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Fetches all projects (web, logo, social) assigned to the currently authenticated designer.
 * @returns {Promise<{ webProjects: any[], logoProjects: any[], socialProjects: any[] }>} An object containing arrays of projects by type.
 * @throws {Error} If the user is not authenticated or if there's a fetch error for any project type.
 */
export const getDesignerAssignedProjects = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Get web design projects
  const { data: webProjects, error: webError } = await supabase
    .from('web_design_projects')
    .select('*, profiles:user_id(full_name)')
    .eq('designer_id', user.id);
  
  if (webError) throw webError;
  
  // Get logo design projects
  const { data: logoProjects, error: logoError } = await supabase
    .from('logo_design_projects')
    .select('*, profiles:user_id(full_name)')
    .eq('designer_id', user.id);
  
  if (logoError) throw logoError;
  
  // Get social graphics projects
  const { data: socialProjects, error: socialError } = await supabase
    .from('social_graphics_projects')
    .select('*, profiles:user_id(full_name)')
    .eq('designer_id', user.id);
  
  if (socialError) throw socialError;
  
  // Combine all projects with project type
  const allProjects = [
    ...webProjects.map(p => ({ ...p, project_type: 'web_design' })),
    ...logoProjects.map(p => ({ ...p, project_type: 'logo_design' })),
    ...socialProjects.map(p => ({ ...p, project_type: 'social_graphics' }))
  ];
  
  return allProjects;
};

/**
 * Fetches a specific project (of any known type) assigned to the current designer.
 * @param {string} projectId - The ID of the project.
 * @param {ProjectType} projectType - The type of the project ('web_design', 'logo_design', 'social_graphics').
 * @returns {Promise<any | null>} The project data or null if not found or not assigned.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getDesignerProject = async (
  projectId: string,
  projectType: ProjectType
) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  let tableName: string;
  switch (projectType) {
    case 'web_design': tableName = 'web_design_projects'; break;
    case 'logo_design': tableName = 'logo_design_projects'; break;
    case 'social_graphics': tableName = 'social_graphics_projects'; break;
    default: throw new Error(`Unsupported project type: ${projectType}`);
  }
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*, profiles:user_id(full_name)')
    .eq('id', projectId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Fetches all revisions for a specific project.
 * @param {string} projectId - The ID of the project.
 * @param {ProjectTypeForRevision} projectType - The type of the project.
 * @returns {Promise<ProjectRevision[]>} An array of project revisions.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getProjectRevisions = async (
  projectId: string, 
  projectType: ProjectTypeForRevision
): Promise<ProjectRevision[]> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_revisions')
    .select('*')
    .eq('project_id', projectId)
    .eq('project_type', projectType)
    .order('version', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Creates a new revision for a project.
 * @param {object} revision - The revision data.
 * @param {string} revision.project_id - The ID of the parent project.
 * @param {ProjectTypeForRevision} revision.project_type - The type of the project.
 * @param {string} revision.title - The title of the revision.
 * @param {string | null} [revision.description] - Optional description.
 * @param {RevisionStatus} [revision.status='draft'] - Initial status.
 * @returns {Promise<ProjectRevision>} The newly created project revision.
 * @throws {Error} If the user is not authenticated or if there's an error creating the revision.
 */
export const createProjectRevision = async (revision: {
  project_id: string;
  project_type: ProjectTypeForRevision;
  title: string;
  description?: string | null;
  status?: RevisionStatus;
}): Promise<ProjectRevision> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Get the latest version number
  const { data: latestRevision } = await supabase
    .from('project_revisions')
    .select('version')
    .eq('project_id', revision.project_id)
    .eq('project_type', revision.project_type)
    .order('version', { ascending: false })
    .limit(1)
    .single();
  
  const newVersion = latestRevision ? (latestRevision.version + 1) : 1;
  
  // Create the new revision
  const { data, error } = await supabase
    .from('project_revisions')
    .insert({
      project_id: revision.project_id,
      project_type: revision.project_type,
      version: newVersion,
      title: revision.title,
      description: revision.description || null,
      status: revision.status || 'pending',
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Updates the status or feedback of a specific project revision.
 * @param {string} revisionId - The ID of the revision to update.
 * @param {Partial<Pick<ProjectRevision, 'status' | 'feedback'>>} updates - An object containing the fields to update ('status' or 'feedback').
 * @returns {Promise<ProjectRevision>} The updated project revision.
 * @throws {Error} If the user is not authenticated or if there's an error updating the revision.
 */
export const updateRevision = async (
  revisionId: string, 
  updates: Partial<Pick<ProjectRevision, 'status' | 'feedback'>>
): Promise<ProjectRevision> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('project_revisions')
    .update(updates)
    .eq('id', revisionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Deletes a specific project revision.
 * @param {string} revisionId - The ID of the revision to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the user is not authenticated or if there's an error deleting the revision.
 */
export const deleteRevision = async (revisionId: string): Promise<void> => {
  const supabase = createClient();
  
  // Delete associated files first
  const { error: deleteFilesError } = await supabase
    .from('revision_files')
    .delete()
    .eq('revision_id', revisionId);
  
  if (deleteFilesError) throw deleteFilesError;
  
  // Delete the revision
  const { error } = await supabase
    .from('project_revisions')
    .delete()
    .eq('id', revisionId);
  
  if (error) throw error;
};

/**
 * Adds a note to a specific project.
 * @param {string} projectId - The ID of the project.
 * @param {ProjectTypeForRevision} projectType - The type of the project.
 * @param {string} content - The content of the note.
 * @param {boolean} [isPrivate=false] - Whether the note is private (admin/designer only).
 * @returns {Promise<ProjectNote>} The newly created project note.
 * @throws {Error} If the user is not authenticated or if there's an error adding the note.
 */
export const addProjectNote = async (
  projectId: string,
  projectType: ProjectTypeForRevision,
  content: string,
  isPrivate: boolean = false
): Promise<ProjectNote> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('project_notes')
    .insert({
      project_id: projectId,
      project_type: projectType,
      designer_id: user.id,
      content,
      is_private: isPrivate
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Fetches all notes for a specific project.
 * Includes logic to filter private notes based on user role.
 * @param {string} projectId - The ID of the project.
 * @param {ProjectTypeForRevision} projectType - The type of the project.
 * @returns {Promise<ProjectNote[]>} An array of project notes accessible to the current user.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getProjectNotes = async (
  projectId: string,
  projectType: ProjectTypeForRevision
): Promise<ProjectNote[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('project_notes')
    .select('*')
    .eq('project_id', projectId)
    .eq('project_type', projectType)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Deletes a specific project note.
 * @param {string} noteId - The ID of the note to delete.
 * @returns {Promise<boolean>} True if deletion was successful.
 * @throws {Error} If the user is not authenticated or if there's an error deleting the note.
 */
export const deleteProjectNote = async (noteId: string): Promise<boolean> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('project_notes')
    .delete()
    .eq('id', noteId)
    .eq('designer_id', user.id); // Ensure user can only delete their own notes

  if (error) throw error;
  return true;
};

/**
 * Fetches tasks assigned to a designer.
 * If userId is provided, fetches tasks for that specific designer (admin usage).
 * If userId is not provided, fetches tasks for the currently authenticated designer.
 * @param {string} [userId] - Optional ID of the designer to fetch tasks for.
 * @returns {Promise<any[]>} An array of tasks (structure needs specific typing).
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getDesignerTasks = async (userId?: string) => {
  const supabase = createClient();
  
  // If userId not provided, use current user
  let designerId = userId;
  if (!designerId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    designerId = user.id;
  }
  
  const { data, error } = await supabase
    .from('designer_tasks')
    .select(`
      *,
      web_design_projects: project_id(
        id, title
      ),
      logo_design_projects: project_id(
        id, title
      ),
      social_graphics_projects: project_id(
        id, title
      )
    `)
    .eq('designer_id', designerId)
    .order('due_date', { ascending: true, nullsFirst: false });
  
  if (error) throw error;
  
  // Process data to create a project field
  return data.map(task => {
    let project = null;
    if (task.project_id && task.project_type) {
      switch (task.project_type) {
        case 'web_design':
          project = task.web_design_projects;
          break;
        case 'logo_design':
          project = task.logo_design_projects;
          break;
        case 'social_graphics':
          project = task.social_graphics_projects;
          break;
      }
    }
    
    // Create a clean task object without the join fields
    const cleanTask = { ...task };
    delete cleanTask.web_design_projects;
    delete cleanTask.logo_design_projects;
    delete cleanTask.social_graphics_projects;
    
    return {
      ...cleanTask,
      project
    };
  });
};

/**
 * Updates the status of a specific designer task.
 * @param {string} taskId - The ID of the task to update.
 * @param {string} status - The new status for the task.
 * @returns {Promise<any>} The updated task data (structure needs specific typing).
 * @throws {Error} If the user is not authenticated or if there's an error updating the task.
 */
export const updateTaskStatus = async (taskId: string, status: string) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('designer_tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('designer_id', user.id) // Only allow updating own tasks
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Fetches the business profile associated with the current user.
 * @returns {Promise<BusinessProfile | null>} The business profile data or null.
 * @throws {Error} If the user is not authenticated or if there's a fetch error.
 */
export const getBusinessProfile = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "No rows returned"
    throw error;
  }
  
  // If no profile exists, create a default one
  if (!data) {
    return await createBusinessProfile();
  }
  
  return data;
};

/**
 * Creates a business profile for the current user if one doesn't exist.
 * @returns {Promise<BusinessProfile>} The newly created or existing business profile.
 * @throws {Error} If the user is not authenticated or if there's an error during creation/fetch.
 */
export const createBusinessProfile = async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Create a basic profile with just the ID
  const { data, error } = await supabase
    .from('business_profiles')
    .insert({ id: user.id })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Updates the business profile for the current user.
 * @param {Partial<BusinessProfile>} updates - An object containing the fields to update.
 * @returns {Promise<BusinessProfile>} The updated business profile data.
 * @throws {Error} If the user is not authenticated or if there's an error during update.
 */
export const updateBusinessProfile = async (updates: Partial<BusinessProfile>) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Add updated_at timestamp
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('business_profiles')
    .update(updatesWithTimestamp)
    .eq('id', user.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Export default client for convenience
export default createClient(); 