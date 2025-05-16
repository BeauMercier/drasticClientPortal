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
import { CheckCircle, Edit3, FileText } from 'lucide-react'; // Added icons

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
                 // User has a saved draft
                return (
                    <div className="p-4 border rounded-lg shadow-sm bg-card space-y-3">
                        <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-blue-500" />
                            <p className="text-sm font-medium">You have a saved draft.</p>
                        </div>
                        <Button onClick={() => { setIsEditing(true); setShowSummaryInsteadOfForm(false);}}>Edit/Continue Draft</Button>
                    </div>
                );
            }

            if (bir.status === 'submitted') {
                const summaryProps: BirSummaryProps = { bir, signedFiles: signedBirFiles };
                return (
                    <div className="p-4 border rounded-lg shadow-sm bg-green-50 border-green-200 space-y-3">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                            <p className="text-sm font-medium text-green-700">Business Information Submitted!</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your answers have been submitted and are awaiting review. You can still make changes if needed.
                        </p>
                        <div className="flex space-x-2">
                            <Button onClick={() => { setIsEditing(true); setShowSummaryInsteadOfForm(false); }}>Edit Information</Button>
                            <Button variant="outline" onClick={() => { setIsEditing(false); setShowSummaryInsteadOfForm(true); }}>Review Submitted Info</Button>
                        </div>
                         {showSummaryInsteadOfForm && <BirSummary {...summaryProps} />}
                    </div>
                );
            }
            
            if (bir.status === 'approved') {
                 const summaryProps: BirSummaryProps = { bir, signedFiles: signedBirFiles };
                 return (
                    <div className="p-4 border rounded-lg shadow-sm bg-blue-50 border-blue-200 space-y-3">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                            <p className="text-sm font-medium text-blue-700">Business Information Approved!</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your business information has been reviewed and approved.
                        </p>
                        <Button variant="outline" onClick={() => { setIsEditing(false); setShowSummaryInsteadOfForm(true); }}>Review Approved Info</Button>
                        {showSummaryInsteadOfForm && <BirSummary {...summaryProps} />}
                    </div>
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