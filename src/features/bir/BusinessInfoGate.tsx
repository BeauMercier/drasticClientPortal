'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth'; // Use the main hook export
import { useBir, UseBirData } from './useBir'; // Import UseBirData
// import BirForm from './BirForm'; // Old form
import MultiStepBirForm from './MultiStepBirForm'; // New multi-step form
import BirSummary, { BirSummaryProps } from './BirSummary'; // Corrected import path if needed, type is now exported
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { KeyedMutator } from 'swr'; // Added for KeyedMutator type
import { Button } from '@/components/ui/button'; // Added Button import
import { BirStatusBanner } from './components/BirStatusBanner';

interface BusinessInfoGateProps {
    projectId: string;
    projectType?: 'web_design' | string; // Make type optional, check defined before use
    parentMutateBir?: KeyedMutator<UseBirData>; // More specific type if possible, or any 
}

/**
 * Conditionally renders the Business Information form or summary
 * based on project type, user role, and BIR status.
 */
export default function BusinessInfoGate({ projectId, projectType, parentMutateBir }: BusinessInfoGateProps) {
    // Get user role from Auth context
    const { user, isLoading: authLoading } = useAuth(); 
    const userRole = user?.role;

    console.log('[BusinessInfoGate] Props:', { projectId, projectType });
    console.log('[BusinessInfoGate] User Role:', userRole);

    // Fetch BIR data
    // Fetch only if projectType is web_design and projectId is valid
    const shouldFetchBir = projectType === 'web_design' && !!projectId;
    const { 
        bir, 
        signedBirFiles, // Destructure signedBirFiles
        isLoading: birLoading, 
        error: birError, 
        mutate: localMutateBir // Renamed internal mutate to avoid conflict
    } = useBir(shouldFetchBir ? projectId : undefined);

    console.log('[BusinessInfoGate] useBir State:', { bir, birLoading, birError, shouldFetchBir });

    // Determine which mutate function to use: prefer parent's if provided
    const effectiveMutateBir: KeyedMutator<any> = parentMutateBir || localMutateBir;

    const [isEditing, setIsEditing] = useState(false); // Default to false
    const [showSummaryInsteadOfForm, setShowSummaryInsteadOfForm] = useState(false); // Default to false

    // Handler for when MultiStepBirForm saves and exits
    const handleFormSaveAndExit = (birId: string | null) => {
        console.log('[BusinessInfoGate] Save and Exit from form. BIR ID:', birId);
        setIsEditing(false); // Hide the form, allow re-evaluation of display
        setShowSummaryInsteadOfForm(false); // show the pending-draft panel instead
        // No redirect here, allow natural re-render based on fetched BIR status
    };

    useEffect(() => {
        // This effect determines the initial editing state when BIR data or loading state changes.
        if (birLoading) {
            // Still loading BIR data, do nothing yet.
            return;
        }

        if (!bir) {
            // No BIR exists for this project. Default to showing the form.
            setIsEditing(true);
        } else {
            // A BIR (pending, submitted, or approved) exists.
            // Default to showing the relevant status panel (i.e., not editing).
            setIsEditing(false);
        }
        // `showSummaryInsteadOfForm` is intentionally not managed here.
        // It's initialized to false and controlled by explicit user actions (e.g., clicking "Review Information").
    }, [bir, birLoading]); // Dependencies are only bir and birLoading

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
        // Case 1: No BIR exists yet, or user wants to start editing.
        if (isEditing || !bir) {
            return <MultiStepBirForm 
                        projectId={projectId} 
                        mutateBir={effectiveMutateBir} 
                        onSaveAndExit={handleFormSaveAndExit} // Pass the callback
                    />;
        }

        // Case 2: BIR exists and is not currently being edited by the user.
        if (bir) { // bir is guaranteed to exist here if !isEditing
            if (bir.status === 'pending') {
               return (
                 <BirStatusBanner
                   status="pending"
                   onEdit={() => setIsEditing(true)}
                 />
               );
            }

            if (bir.status === 'submitted') {
                const summaryProps: BirSummaryProps = { bir, signedFiles: signedBirFiles };
                return (
                  <>
                    <BirStatusBanner
                      status="submitted"
                      onEdit={() => {
                        setIsEditing(true);
                        setShowSummaryInsteadOfForm(false);
                      }}
                      onReview={() => {
                        setIsEditing(false);
                        setShowSummaryInsteadOfForm(true);
                      }}
                    />
                    {showSummaryInsteadOfForm && <BirSummary {...summaryProps} />}
                  </>
                );
            }
            
            if (bir.status === 'approved') {
                const summaryProps: BirSummaryProps = { bir, signedFiles: signedBirFiles };
                return (
                  <>
                    <BirStatusBanner
                      status="approved"
                      onReview={() => setShowSummaryInsteadOfForm(true)}
                    />
                    {showSummaryInsteadOfForm && <BirSummary {...summaryProps} />}
                  </>
                );
            }
        }
        // Fallback for client if no conditions met (should ideally be covered by !bir || isEditing)
        return <MultiStepBirForm 
                   projectId={projectId} 
                   mutateBir={effectiveMutateBir} 
                   onSaveAndExit={handleFormSaveAndExit} // Pass the callback here too
               />;
    }

    /* ---------- DESIGNER / ADMIN VIEW ---------- */
    if (userRole === 'designer' || userRole === 'admin') {
        console.log('[BusinessInfoGate] Entering Designer/Admin view logic.');
        // Show summary if BIR exists
        if (bir) {
            console.log('[BusinessInfoGate] Designer/Admin: BIR data exists, rendering BirSummary.');
            return <BirSummary bir={bir} signedFiles={signedBirFiles} />;
        }
        // Show placeholder if BIR doesn't exist
        console.log('[BusinessInfoGate] Designer/Admin: BIR data does NOT exist or is null/undefined, showing placeholder.');
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