import useSWR from 'swr';
import { Bir } from '@/lib/types/bir';

// Define a generic fetcher function
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({})); // Attempt to parse error body
        const error = new Error(`Request failed: ${res.status} ${res.statusText}. ${errorBody?.error || ''}`.trim());
        // You could potentially add more info to the error object if needed
        // error.info = errorBody;
        // error.status = res.status;
        throw error;
    }
    return res.json();
};

/**
 * Fetches the single BIR attached to a project using SWR.
 * The API endpoint called relies on Supabase RLS to ensure the caller 
 * only sees data they are permitted to access.
 *
 * Args:
 *   projectId: The UUID of the project. If undefined, SWR will not fetch.
 *
 * Returns:
 *   An object containing:
 *     - bir: The fetched BIR data (Bir | null) or null if loading or not found.
 *     - isLoading: Boolean indicating if the request is in progress.
 *     - error: Any error object returned by SWR/fetcher.
 *     - mutate: The SWR mutate function to trigger revalidation.
 */
export function useBir(projectId?: string) {
    // Conditionally fetch only if projectId is provided
    const swrKey = projectId ? `/api/bir?projectId=${projectId}` : null;

    const { data, error, isLoading, mutate } = useSWR<Bir | null>(
        swrKey, 
        fetcher,
        {
            // Optional: Add SWR configuration here (e.g., revalidation options)
            // revalidateOnFocus: false,
        }
    );

    return {
        bir: data ?? null, // Ensure null is returned instead of undefined during initial load
        isLoading,
        error,
        mutate, // Expose mutate so UI can revalidate after save
    };
} 