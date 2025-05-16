import useSWR, { KeyedMutator } from 'swr';
import { Project } from '@/lib/types/project'; // General Project type

// ProjectDetails can be a generic type extending the base Project
export interface BaseProjectDetails extends Project {
  // Common fields for any detailed project view could go here if necessary
}

interface UseProjectData<T extends BaseProjectDetails> {
  project?: T;
  error?: any;
  isLoading: boolean;
  mutate: KeyedMutator<T | null>;
}

const fetcher = async <T extends BaseProjectDetails>(url: string): Promise<T | null> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.error || errorData.message || 'An error occurred while fetching the project.');
  }
  const data = await res.json();
  // Assuming the API returns the project object directly or nested under a key like "project"
  // Adjust data.project if your API nests the project object
  return (data.project || data) as T | null;
};

/**
 * Custom SWR hook to fetch detailed project information.
 *
 * @template T The specific project type, extending BaseProjectDetails.
 * @param projectId The ID of the project.
 * @param projectType The type of the project (e.g., 'web_design', 'logo_design').
 * @returns {UseProjectData<T>} The project data, loading state, error, and mutate function.
 */
export function useProject<T extends BaseProjectDetails = BaseProjectDetails>(
  projectId?: string, 
  projectType?: string
): UseProjectData<T> {
  const key = (projectId && projectType) ? `/api/projects/${projectType}/${projectId}` : null;

  const { data, error, mutate, isLoading } = useSWR<T | null>(
    key,
    (url: string) => fetcher<T>(url), // Pass the generic type to fetcher
    {
      revalidateOnFocus: true,
    }
  );

  return {
    project: data || undefined,
    error,
    isLoading,
    mutate,
  };
} 