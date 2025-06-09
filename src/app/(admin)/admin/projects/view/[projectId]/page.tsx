'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessInfoGate from '@/features/bir/BusinessInfoGate';
import { useToast } from '@/components/ui/use-toast';
import ProjectFileList from '@/app/(admin)/admin/projects/components/ProjectFileList';
import AdminBirDetailsView from '@/app/(admin)/admin/projects/components/AdminBirDetailsView';
import { BirRow } from '@/lib/types/bir';

// TODO: Define a comprehensive ProjectDetails type for Admins, including files
interface AdminProjectViewDetails {
  id: string;
  title: string;
  project_type: 'web_design' | 'logo_design' | 'social_graphics' | string; // Allow string for flexibility
  description?: string;
  status?: string; // Added status field
  client?: { id: string; full_name?: string; email?: string; company?: string };
  designer_assignment?: { id: string; full_name?: string; email?: string };
  bir?: BirRow | null;
  bir_id?: string | null;
  bir_status?: 'pending' | 'submitted' | 'approved' | null;
  // Add other fields from admin project API
  // files?: ProjectFile[]; // Placeholder for files array
}

// interface ProjectFile {
//   id: string;
//   name: string;
//   url: string;
//   type: string; // e.g., 'image/jpeg', 'application/pdf'
//   size: number; // in bytes
//   uploaded_at: string;
// }

export default function AdminDetailedProjectViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const projectType = searchParams.get('type');

  const [project, setProject] = useState<AdminProjectViewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectDetails = async () => {
      console.log('[AdminDetailedProjectViewPage] Props for file list:', { pid: projectId, ptype: projectType });
      if (!projectId || !projectType || !isAuthenticated) {
        if (isAuthenticated === false && !authLoading) { // Only redirect if auth is resolved and not authenticated
            toast({ title: 'Authentication Required', description: 'Please log in to view project details.', variant: 'destructive' });
            router.push('/login');
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch main project details from the admin-specific endpoint
        // The path depends on the projectType
        const apiUrl = `/api/admin/projects/${projectType}/${projectId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
          if (response.status === 403 || response.status === 404) {
            toast({
              title: response.status === 403 ? 'Access Denied' : 'Project Not Found',
              description: errorData.error || (response.status === 403 ? "You don't have permission to view this project." : "The requested project does not exist."),
              variant: 'destructive',
            });
            router.push('/admin/projects');
            return;
          }
          throw new Error(errorData.error || `Failed to fetch project details. Status: ${response.status}`);
        }
        const fetchedProjectData = await response.json();
        console.log('[AdminDetailedProjectViewPage] Fetched project data from API:', fetchedProjectData);
        setProject(fetchedProjectData as AdminProjectViewDetails);

        // TODO: Fetch project files (e.g., /api/admin/projects/${projectType}/${projectId}/files)
        // const filesResponse = await fetch(`/api/admin/projects/${projectType}/${projectId}/files`);
        // if (filesResponse.ok) { ... setFiles ... }

      } catch (err: any) {
        console.error("Error loading project details for admin:", err);
        setError(err.message || 'Failed to load project details.');
        toast({
          title: 'Error Loading Project',
          description: err.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadProjectDetails();
    }
  }, [projectId, projectType, authLoading, isAuthenticated, router, toast]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-48 rounded-lg" />
        {projectType === 'web_design' && <Skeleton className="h-64 rounded-lg" />}
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (error && !project) {
    return <p className="text-destructive text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-md">Error: {error}</p>;
  }

  if (!project) {
    return <p className="text-center p-6 text-muted-foreground">Project data could not be loaded or project not found.</p>;
  }

  // Ensure projectType is valid before using it for API calls or conditional rendering
  if (!projectType || !['web_design', 'logo_design', 'social_graphics'].includes(projectType)) {
    return <p className="text-destructive text-center p-6">Invalid project type specified.</p>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
        <p className="text-muted-foreground">Admin Detailed View</p>
      </header>
      
      <Card>
        <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Project ID:</strong> {project.id}</p>
          <p><strong>Type:</strong> <span className="capitalize">{project.project_type?.replace('_', ' ')}</span></p>
          <p><strong>Status:</strong> <span className="capitalize">{project.status || 'N/A'}</span></p> {/* Assuming status comes from API */}
          <p><strong>Description:</strong> {project.description || 'No description provided.'}</p>
          {project.client && (
            <p><strong>Client:</strong> {project.client.full_name || project.client.email} {project.client.company ? `(${project.client.company})` : ''}</p>
          )}
          {project.designer_assignment && (
            <p><strong>Assigned Designer:</strong> {project.designer_assignment.full_name || project.designer_assignment.email}</p>
          )}
        </CardContent>
      </Card>

      {projectType === 'web_design' && project.id && (
        <Card>
          <CardHeader><CardTitle>Business Information & Client Files</CardTitle></CardHeader>
          <CardContent>
            <AdminBirDetailsView bir={project.bir} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Project Files (Admin View)</CardTitle>
            {/* Optional: Add a CardDescription if desired */}
            {/* <CardDescription>All files uploaded by the client, designer, or anyone else.</CardDescription> */}
        </CardHeader>
        <CardContent>
          <ProjectFileList
            projectId={project.id}
            projectType={projectType as 'web_design' | 'logo_design' | 'social_graphics'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tasks (Admin View)</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">Task overview for this project will be displayed here.</p>
        </CardContent>
      </Card>

    </div>
  );
} 