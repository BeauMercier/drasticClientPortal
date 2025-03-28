/**
 * Projects Feature
 * 
 * This is the main entry point for the projects feature.
 * It exports all components, hooks, contexts and API functions.
 */

// Export all types
export * from './types';

// Export API functions
export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from './api';

// Export hooks
export * from './hooks';
