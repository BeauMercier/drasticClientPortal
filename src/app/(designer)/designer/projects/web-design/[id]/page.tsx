'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
// import { getProjectForDesigner } from '@/lib/api/client-api'; // TODO: Implement or verify this API function
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessInfoGate from '@/features/bir/BusinessInfoGate'; // Import the gate
import { useToast } from '@/components/ui/use-toast'; // Import useToast hook

// Assume a Project type exists or define a basic one
// TODO: Replace with actual shared Project type if available
interface ProjectDetails { // Basic structure, expand as needed based on API response
    id: string;
    title: string;
    project_type: string;
    description?: string; // Example field
    // Add other fields returned by /api/projects/web_design/[projectId]
    client?: { id: string; full_name?: string; email?: string; company?: string };
    designer_assignment?: { id: string; full_name?: string; email?: string };
    // Potentially other fields like status, dates etc.
}

/**
 * NOTE: This page currently uses placeholder data. Actual data fetching
 * needs to be implemented, including the getProjectForDesigner function.
 *
 * Designer view for a specific project's details.
 */
export default function DesignerProjectDetailsPage() {
    const { projectType, id } = useParams(); // Get params from URL
    const router = useRouter(); // Initialize useRouter
    const { user, isLoading: authLoading } = useAuth();
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast(); // Get toast function from the hook

    useEffect(() => {
        const loadProject = async () => {
            const projectId = Array.isArray(id) ? id[0] : id;
            // projectType from URL params can be used for validation if needed, but API path is specific
            const currentProjectType = 'web_design'; // Hardcoded as this page is for web_design

            if (!projectId || !user) { // User must be loaded to ensure auth checks on API pass
                setIsLoading(false); // Stop loading if no projectId or user
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/projects/web_design/${projectId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                    // Check for 403/404 for redirect
                    if (response.status === 403 || response.status === 404) {
                        toast({
                            title: response.status === 403 ? 'Access Denied' : 'Project Not Found',
                            description: errorData.error || (response.status === 403 ? "You don't have permission to view this project." : "The requested project does not exist."),
                            variant: 'destructive',
                        });
                        router.push('/designer/projects'); // Redirect to projects list
                        return; // Stop further processing
                    }
                    throw new Error(errorData.error || `Failed to fetch project details. Status: ${response.status}`);
                }
                const fetchedProject = await response.json();
                setProject(fetchedProject as ProjectDetails);
            } catch (err: any) {
                console.error("Error loading project for designer:", err);
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

        if (!authLoading) { // Only run if auth state is resolved
            loadProject();
        }
    }, [id, user, authLoading]); // projectType from URL can be added if used in fetch path or logic

    if (isLoading || authLoading) {
        // Basic loading state
        return (
            <div className="container mx-auto p-4 space-y-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-40 rounded-lg" />
                 <Skeleton className="h-60 rounded-lg" />
            </div>
        );
    }

    if (error && !project) { // Show error only if no placeholder is set
        return <p className="text-destructive text-center p-4">Error: {error}</p>;
    }

    if (!project) {
        // This might briefly show if loading or if project is null after an error without explicit error message shown
        return <p className="text-center p-4">Loading project data or project not found...</p>;
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">{project.title} (Designer View)</h1>
            
            {/* Placeholder for other project details */}
            <Card>
                 <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
                 <CardContent>
                    <p>Project ID: {project.id}</p>
                    <p>Type: {project.project_type}</p>
                    {project.description && <p>Description: {project.description}</p>}
                    {project.client && <p>Client: {project.client.full_name || project.client.email}</p>}
                 </CardContent>
            </Card>

            {/* Integrate Business Info Gate - Only show if web design */}
            {project && project.id && project.project_type === 'web_design' && (
                 <Card>
                    {/* <CardHeader>
                        <CardTitle>Business Information & Client Files</CardTitle>
                    </CardHeader> */}
                    <CardContent>
                        <BusinessInfoGate 
                            projectId={project.id}
                            projectType={project.project_type} // This will be 'web_design'
                        />
                    </CardContent>
                </Card>
            )}

             {/* Placeholder for tasks, files etc. */}
              <Card>
                 <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
                 <CardContent><p>Tasks assigned for this project...</p></CardContent>
            </Card>

        </div>
    );
} 