'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth';
// import { getProjectForDesigner } from '@/lib/api/client-api'; // TODO: Implement or verify this API function
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessInfoGate from '@/features/bir/BusinessInfoGate'; // Import the gate

// Assume a Project type exists or define a basic one
// TODO: Replace with actual shared Project type if available
interface ProjectDetails {
    id: string;
    title: string;
    project_type: string;
    // other fields...
}

/**
 * NOTE: This page currently uses placeholder data. Actual data fetching
 * needs to be implemented, including the getProjectForDesigner function.
 *
 * Designer view for a specific project's details.
 */
export default function DesignerProjectDetailsPage() {
    const { projectType, id } = useParams(); // Get params from URL
    const { user, isLoading: authLoading } = useAuth();
    const [project, setProject] = useState<ProjectDetails | null>(null); // Keep state, but populate with placeholder
    const [isLoading, setIsLoading] = useState(true); // Keep loading state
    const [error, setError] = useState<string | null>(null);

     // --- Placeholder Data --- 
     // --- START: Placeholder Data Section --- 
     // This section simulates project data loading for development purposes.
     // TODO: Remove this entire placeholder section (including the useEffect below) 
     //       once the actual data fetching logic is implemented using a function like `getProjectForDesigner`.
     const placeholderProjectId = Array.isArray(id) ? id[0] : id || 'placeholder-id';
     const placeholderProjectType = Array.isArray(projectType) ? projectType[0] : projectType || 'web_design';
     const placeholderProject: ProjectDetails = {
         id: placeholderProjectId,
         title: `Project ${placeholderProjectId}`,
         project_type: placeholderProjectType,
     };
     // Simulate loading and setting placeholder data
     useEffect(() => {
         if (!authLoading) {
             setTimeout(() => {
                 setProject(placeholderProject);
                 setIsLoading(false);
             }, 500); // Simulate network delay
         }
     }, [authLoading, placeholderProject]); 
     // --- END: Placeholder Data Section ---

    /* // --- Actual Data Fetching Logic (Commented Out) ---
    useEffect(() => {
        const loadProject = async () => {
            const projectId = Array.isArray(id) ? id[0] : id;
            const type = Array.isArray(projectType) ? projectType[0] : projectType;

            if (!projectId || !type || !user) return;

            setIsLoading(true);
            setError(null);
            try {
                // TODO: Implement or verify getProjectForDesigner API function
                // const fetchedProject = await getProjectForDesigner(projectId, type);
                 const fetchedProject = null; // Temporarily null
                if (!fetchedProject) {
                    throw new Error('Project not found or access denied.');
                }
                // setProject(fetchedProject as ProjectDetails);
            } catch (err: any) {
                console.error("Error loading project for designer:", err);
                setError(err.message || 'Failed to load project details.');
                setProject(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
             loadProject();
        }
    }, [id, projectType, user, authLoading]);
    */

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
        // This might briefly show if placeholder hasn't set yet
        return <p className="text-center p-4">Loading project data...</p>;
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">{project.title} (Designer View)</h1>
            
            {/* Placeholder for other project details */}
            <Card>
                 <CardHeader><CardTitle>Project Summary</CardTitle></CardHeader>
                 <CardContent><p>Details about project {project.id}...</p></CardContent>
            </Card>

            {/* Integrate Business Info Gate - Only show if web design */}
            {project.project_type === 'web_design' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BusinessInfoGate 
                            projectId={project.id}
                            projectType={project.project_type}
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