import React from 'react';
import { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No projects found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        console.log('Mapping project:', project?.id, 'Status:', project?.status, 'Type:', typeof project?.status);

        return (
          <div 
            key={project.id} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between">
              <h3 className="font-medium text-secondary-800">{project.title || project.name}</h3>
              <span className={`text-sm px-2 py-1 rounded ${getStatusColor(project?.status)}`}>
                {project?.status ?? 'N/A'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {project.description || 'No description provided'}
            </p>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Created: {formatDate(project.created_at)}</span>
              {project.updated_at && (
                <span>Updated: {formatDate(project.updated_at)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const getStatusColor = (status: string | null | undefined) => {
  console.log('getStatusColor received status:', status, 'Type:', typeof status);
  if (!status) {
    console.log('getStatusColor returning default for null/undefined status.');
    return 'bg-gray-100 text-gray-800';
  }
  if (typeof status !== 'string') {
     console.warn('getStatusColor received non-string status:', status);
     return 'bg-gray-100 text-gray-800';
  }
  const lowerStatus = status.toLowerCase();
  console.log('getStatusColor lowerStatus:', lowerStatus);
  switch (lowerStatus) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'on hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}; 