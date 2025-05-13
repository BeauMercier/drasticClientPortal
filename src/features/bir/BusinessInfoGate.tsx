'use client';

import { useAuth } from '@/features/auth'; // Use the main hook export
import { useBir } from './useBir';
// import BirForm from './BirForm'; // Old form
import MultiStepBirForm from './MultiStepBirForm'; // New multi-step form
import BirSummary from './BirSummary';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface BusinessInfoGateProps {
    projectId: string;
    projectType?: 'web_design' | string; // Make type optional, check defined before use
}

/**
 * Conditionally renders the Business Information form or summary
 * based on project type, user role, and BIR status.
 */
export default function BusinessInfoGate({ projectId, projectType }: BusinessInfoGateProps) {
    // Get user role from Auth context
    const { user, isLoading: authLoading } = useAuth(); 
    const userRole = user?.role;

    // Fetch BIR data
    // Fetch only if projectType is web_design and projectId is valid
    const shouldFetchBir = projectType === 'web_design' && !!projectId;
    const { bir, signedBirFiles, isLoading: birLoading, error: birError, mutate: mutateBir } = useBir(shouldFetchBir ? projectId : undefined);

    // --- Loading States --- //
    // Wait for both auth state and BIR data (if applicable)
    const isLoading = authLoading || (shouldFetchBir && birLoading);
    if (isLoading) {
        // Show skeleton loaders for better UX
        return (
            <div className="space-y-3 p-4 border rounded-lg shadow-sm bg-card">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-full" />
           </div>
        );
    }

    // --- Gate check: Only applies to web_design projects --- //
    if (projectType !== 'web_design') {
        return null; // Or render a message indicating it's not applicable
    }

    // --- Error State --- //
    if (birError) {
        // Log the error for debugging
        console.error("Error fetching BIR:", birError);
        return <p className="text-destructive p-4 border border-destructive rounded-md">Error loading business information: {birError.message}</p>;
    }

    // --- Role-based Rendering Logic --- //

    /* ---------- CLIENT VIEW ---------- */
    if (userRole === 'client') {
        // BIR doesn't exist yet or is pending -> Show editable form
        if (!bir || bir.status === 'pending') {
            // return <BirForm projectId={projectId} mutateBir={mutateBir} />;
            return <MultiStepBirForm projectId={projectId} mutateBir={mutateBir} />;
        }
        
        // BIR submitted or approved -> Show summary + status message
        return (
            <div className="space-y-4">
                <BirSummary bir={bir} signedFiles={signedBirFiles} />
                {bir.status === 'submitted' && (
                    <p className="text-sm italic text-yellow-600 bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                        Your answers have been submitted and are awaiting review.
                    </p>
                )}
                 {/* Optionally add a message for approved status if needed */}
                 {/* {bir.status === 'approved' && (...)} */}
            </div>
        );
    }

    /* ---------- DESIGNER / ADMIN VIEW ---------- */
    if (userRole === 'designer' || userRole === 'admin') {
        // Show summary if BIR exists
        if (bir) {
            return <BirSummary bir={bir} signedFiles={signedBirFiles} />;
        }
        // Show placeholder if BIR doesn't exist
        return (
            <p className="italic text-muted-foreground p-4 border rounded-lg">
                The client has not submitted their business information yet.
            </p>
        );
    }

    // Fallback if user role is somehow undefined or unexpected (shouldn't happen with proper auth)
     console.warn('BusinessInfoGate: Unexpected user role or state.', { userRole });
    return null;
} 