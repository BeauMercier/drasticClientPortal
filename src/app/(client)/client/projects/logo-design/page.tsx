'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/api/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Project, ProjectStatus } from '@/lib/types/project';

const LogoDesignPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .eq('project_type', 'logo_design');

      if (error) throw error;
      if (projectsData) {
        const activeProjects = projectsData.filter(
          (project: { is_placeholder: boolean }) => !project.is_placeholder
        );
        setProjects(activeProjects as Project[]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Your Logo Design Projects</h1>
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      ) : (
        <p>You have no active logo design projects.</p>
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

type ProjectCardProps = {
  project: Project;
  onClick: () => void;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const getStatusPill = (status: ProjectStatus | string | null) => {
    let className = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'in_progress':
        className += ' bg-blue-200 text-blue-800';
        break;
      case 'completed':
        className += ' bg-green-200 text-green-800';
        break;
      case 'on_hold':
        className += ' bg-yellow-200 text-yellow-800';
        break;
      default:
        className += ' bg-gray-200 text-gray-800';
        break;
    }
    return <span className={className}>{status || 'N/A'}</span>;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <h3 className="text-xl font-bold mb-2">{project.name}</h3>
        <p className="text-gray-600 mb-4">
          {project.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="font-semibold mr-2">Status:</span>
          {getStatusPill(project.status)}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-semibold mr-2">Created:</span>
          <span>
            {project.created_at
              ? format(new Date(project.created_at), 'PPP')
              : 'N/A'}
          </span>
        </div>
      </div>
      <button
        onClick={e => {
          e.stopPropagation();
          // Handle view details action
        }}
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 self-start"
      >
        View Details
      </button>
    </div>
  );
};

// A simple modal for showing project details
type ProjectDetailModalProps = {
  project: Project;
  onClose: () => void;
};

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">{project.name}</h2>
        <p>Details about the project go here.</p>
        <button
          onClick={onClose}
          className="mt-6 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LogoDesignPage; 