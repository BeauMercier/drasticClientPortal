'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FieldErrors, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyedMutator } from 'swr';
import { clsx } from 'clsx';
import { XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useBir } from './useBir';
import { useAuth } from '@/features/auth';
import {
  birInsertSchema,
  birUpdateSchema,
  birStatusSchema,
  BirAnswersData,
  BirUpdateDTO,
  BirInsertDTO,
  FormValues as BirFormValues, // Renaming to avoid conflict if MultiStepBirForm has its own FormValues
} from '@/lib/validation/bir';
import { birStepsConfig, BirStep, StepProps } from './birStepConfig';
// Import FileUploadStep when it's created
// import FileUploadStep from './steps/FileUploadStep';

// Helper to get default values for the complex answers object (can be reused or adapted)
const getDefaultAnswers = (): BirAnswersData => ({
  official_company_name: '',
  official_company_phone: '',
  official_company_email: '',
  official_company_address: '',
  email: '',
  website_url: '',
  facebook_url: '',
  instagram_url: '',
  other_social_links: [],
  services_description: '',
  company_history_mission: '',
  team_member_profiles: '',
  certifications_testimonials_case_studies: '',
  partnerships_affiliations: '',
  faqs_key_information: '',
  specific_features_requests: '',
  additional_comments: '',
});

// Type guard (can be reused or adapted)
function isValidAnswersObject(answers: any): answers is Partial<BirAnswersData> {
  return typeof answers === 'object' && answers !== null && !Array.isArray(answers);
}

// New utility function to remove empty string properties from an object
function pruneEmptyStrings(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== '')
  );
}

interface MultiStepBirFormProps {
  projectId: string;
  mutateBir: KeyedMutator<any>; // This is the mutate function from the parent useBir hook
  onSaveAndExit?: (birId: string | null) => void; // Added new prop
}

/**
 * Orchestrator component for the multi-step Business Information Request form.
 * Manages form state using react-hook-form, navigates between different steps
 * defined in `birStepsConfig`, handles data fetching via `useBir` and `useAuth`,
 * and processes the submission of BIR data.
 *
 * @param {MultiStepBirFormProps} props The component props.
 * @param {string} props.projectId The ID of the current project.
 * @param {KeyedMutator<any>} props.mutateBir The SWR mutate function from the parent
 *   component (likely BusinessInfoGate) to revalidate BIR data globally after submission.
 * @returns {JSX.Element} The multi-step BIR form component.
 */
export default function MultiStepBirForm({ projectId, mutateBir: parentMutateBir, onSaveAndExit }: MultiStepBirFormProps) {
  const { bir: fetchedBir, isLoading: birLoading, error: birError, mutate: localMutateBir } = useBir(projectId);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmittingTextData, setIsSubmittingTextData] = useState(false);
  const [textDataSubmittedSuccessfully, setTextDataSubmittedSuccessfully] = useState(false);

  const textualSteps = birStepsConfig;
  const isLastTextualStep = currentStepIndex === textualSteps.length - 1;

  // Define isEditing early, before any potential early returns related to loading/error states.
  // It depends on textDataSubmittedSuccessfully and fetchedBir status.
  const isApproved = fetchedBir && fetchedBir.status === 'approved';
  const isEditing = !textDataSubmittedSuccessfully && !isApproved;

  // Scroll lock effect - Called unconditionally at the top level
  useEffect(() => {
    if (isEditing) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isEditing]);

  const form = useForm<BirFormValues>({
    resolver: zodResolver(birInsertSchema),
    defaultValues: {
      project_id: projectId,
      project_type: 'web_design',
      client_id: user?.id || '',
      answers: getDefaultAnswers(),
    },
  });

  useEffect(() => {
    if (user?.id && !form.getValues('client_id')) {
      form.setValue('client_id', user.id);
    }
    if (birLoading) return;
    if (!textDataSubmittedSuccessfully && !isApproved) { // Only reset if editing and not approved
      if (fetchedBir && isValidAnswersObject(fetchedBir.answers)) {
        const mergedAnswers = { ...getDefaultAnswers(), ...fetchedBir.answers };
        form.reset({
          project_id: fetchedBir.project_id,
          client_id: user?.id || fetchedBir.client_id || '',
          project_type: 'web_design',
          answers: mergedAnswers,
        }, { keepValues: form.formState.isDirty });
      } else if (!birError && !fetchedBir && user?.id) {
        form.reset({
          project_id: projectId,
          project_type: 'web_design',
          client_id: user.id,
          answers: getDefaultAnswers(),
        });
      }
    }
  }, [fetchedBir, projectId, birLoading, birError, user, form, textDataSubmittedSuccessfully, isApproved]);

  const handleNextStep = async () => {
    const currentStepFields = textualSteps[currentStepIndex].fields;
    const fieldsToValidate = currentStepFields.map(field => `answers.${field}` as Path<BirFormValues>);
    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);
    if (isValid) {
      if (!isLastTextualStep) setCurrentStepIndex((prev) => prev + 1);
    } else {
      toast({ title: "Validation Error", description: "Please check errors.", variant: "destructive" });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSaveDraft = async () => {
    setIsSubmittingTextData(true);
    const currentValues = form.getValues();
    let savedBirId: string | null = null;
    try {
      if (fetchedBir && fetchedBir.id) {
        const updatePayload: BirUpdateDTO = { id: fetchedBir.id, answers: pruneEmptyStrings(currentValues.answers ?? {}), status: 'pending' };
        const validationResult = birUpdateSchema.safeParse(updatePayload);
        if (!validationResult.success) throw new Error('Validation failed saving draft.');
        const res = await fetch('/api/bir', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validationResult.data) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to save draft.');
        savedBirId = result.id;
      } else {
        const insertPayload: BirInsertDTO = { project_id: projectId, client_id: user?.id || '', project_type: 'web_design', answers: pruneEmptyStrings(currentValues.answers ?? {}), status: 'pending' };
        const basicInsertSchema = z.object({ project_id: z.string().uuid(), client_id: z.string().uuid(), project_type: z.literal('web_design'), answers: z.any(), status: birStatusSchema.optional() });
        const validationResult = basicInsertSchema.safeParse(insertPayload);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            throw new Error(`Basic validation failed: ${errorMessages}`);
        }
        const res = await fetch('/api/bir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validationResult.data) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to save draft.');
        savedBirId = result.id;
      }
      toast({ title: "Draft Saved", description: "Progress saved." });
      await parentMutateBir(); 
      await localMutateBir();  
      if (onSaveAndExit) {
        onSaveAndExit(savedBirId);
      }
    } catch (error: any) {
      toast({ title: "Error Saving Draft", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingTextData(false);
    }
  };
  
  const handleSubmitAllAnswers: SubmitHandler<BirFormValues> = async (values) => {
    setIsSubmittingTextData(true);
    const isUpdateMode = !!(fetchedBir && fetchedBir.id);
    const method = isUpdateMode ? 'PATCH' : 'POST';
    let payload: any;
    try {
      const processedAnswers = values.answers;
      if (isUpdateMode && fetchedBir) {
        const updatePayload: BirUpdateDTO = { id: fetchedBir.id, answers: processedAnswers, status: 'submitted' };
        const validationResult = birUpdateSchema.safeParse(updatePayload);
        if (!validationResult.success) throw new Error('Validation failed for update.');
        payload = validationResult.data;
      } else {
        const insertPayload: BirInsertDTO = { project_id: projectId, client_id: user?.id || '', project_type: 'web_design', answers: processedAnswers, status: 'submitted' };
        const validationResult = birInsertSchema.safeParse(insertPayload);
        if (!validationResult.success) throw new Error('Validation failed for insert.');
        payload = validationResult.data;
      }
      const res = await fetch('/api/bir', { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');
      toast({ title: "Success", description: `Business information ${isUpdateMode ? 'updated' : 'submitted'}.` });
      setTextDataSubmittedSuccessfully(true); // This will set isEditing to false
      await parentMutateBir();
      await localMutateBir();
    } catch (error: any) {
      toast({ title: "Error Submitting", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingTextData(false);
    }
  };

  const onFormError = (errors: FieldErrors<BirFormValues>) => {
    console.error('RHF validation errors:', errors);
    toast({ title: "Validation Error", description: "Please review form.", variant: "destructive" });
  };

  const handleEdit = () => {
    setTextDataSubmittedSuccessfully(false); // This will set isEditing to true
    setCurrentStepIndex(0);
  };
  
  // New handler for the "X" button in the overlay header - Defined before early returns
  const handleCloseOverlay = () => {
    handleSaveDraft(); 
  };

  // Approved state check - Renders separately and exits early
  if (isApproved) { // Use the early defined isApproved flag
    return (
      <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
        {/* Visual Stepper - Still show progress (all green) */}
        <div className="mb-10 flex items-start justify-center space-x-6 sm:space-x-10 overflow-x-auto pb-4 pt-2">
          {textualSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-28 sm:w-32">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ease-in-out border-2 bg-green-500 text-white border-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-center text-muted-foreground">{step.name}</p>
            </div>
          ))}
        </div>
        <div className="p-6 text-center bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Information Approved</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">This business information request has been approved and cannot be edited.</p>
        </div>
      </div>
    );
  }
  
  // Loading / Error / No User states (these are fine for early returns after hooks)
  if (authLoading || (birLoading && !fetchedBir)) return <p>Loading Business Information Form...</p>; // Adjusted birLoading condition
  if (birError && !fetchedBir) return <p className="text-red-600">Error loading form data: {birError.message}</p>; // Adjusted birError condition
  if (!user) return <p className="text-red-600">Error: User not found. Cannot display form.</p>;
  
  const CurrentStepComponent = textualSteps[currentStepIndex].component as React.ComponentType<StepProps>;

  // This is the content that will be rendered either inline or inside the overlay
  const internalFormContent = (
    <>
      {/* Compact Mobile Header for STEPS (only when isEditing and on mobile) */}
      {isEditing && (
        <div className="sm:hidden px-4 pt-6 pb-2"> 
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Step {currentStepIndex + 1} of {textualSteps.length}
          </p>
          <h2 className="mt-1 text-base font-medium text-primary-600 dark:text-primary-400">
            {textualSteps[currentStepIndex].name}
          </h2>
        </div>
      )}

      {/* FULL SCROLLABLE STEPPER (Buttons) */}
      <div
        className={clsx(
          "overflow-x-auto space-x-4 sm:space-x-6 pb-4", 
          isEditing 
            ? "hidden sm:flex mt-6 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-700" // Added border-t here for editing overlay
            : "flex mb-10", 
           // Removed border from here: isEditing && textualSteps.length > 0 && "border-b dark:border-gray-700"
           // Border is now part of the editing mode's stepper container directly for visual hierarchy with overlay header
        )}
      >
        {textualSteps.map((step, index) => {
          const isActiveButton = isEditing && (index === currentStepIndex);
          const isCompleteForButtonStyling = !isEditing || (isEditing && index < currentStepIndex);
          return (
            <button
              key={step.id}
              disabled={!isEditing}
              onClick={() => isEditing && setCurrentStepIndex(index)}
              className={clsx(
                "flex-shrink-0 w-24 sm:w-28 text-center rounded-md py-2 focus:outline-none transition-colors duration-150",
                isActiveButton && "bg-primary-600 text-white dark:bg-primary-500 dark:text-white shadow-md",
                isCompleteForButtonStyling && !isActiveButton && "bg-primary-100 text-primary-600 dark:bg-primary-700 dark:text-primary-200",
                !isActiveButton && !isCompleteForButtonStyling && "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                !isEditing && "cursor-default opacity-75"
              )}
              aria-current={isActiveButton ? "step" : undefined}
            >
              <span className="block text-sm font-medium">{index + 1}</span>
              <span className="mt-1 block text-[11px] leading-tight truncate">
                {step.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actual Form Content or Summary Card */}
      {/* Wrapper for content area with max-width for overlay mode, and conditional padding */}
      <div className={clsx(
          isEditing ? "flex-1 px-4 sm:px-6 pb-20 pt-2 overflow-y-auto" : "pt-0" 
        )}
      >
        <div className={clsx(isEditing && "max-w-2xl mx-auto")}> 
          {textDataSubmittedSuccessfully && !isApproved ? (
            <div className="p-6 text-center bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Information Submitted</h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">Your business information has been successfully submitted.</p>
              <p className="text-sm text-muted-foreground mt-1">You can proceed to upload files or edit the information.</p>
              <div className="mt-4 flex justify-center space-x-3">
                <Button onClick={handleEdit} variant="outline">Edit Information</Button>
              </div>
            </div>
          ) : !isApproved && (
            <>
              <form onSubmit={form.handleSubmit(handleSubmitAllAnswers, onFormError)} className="space-y-6">
                <CurrentStepComponent form={form} isSubmitting={isSubmittingTextData || authLoading || birLoading} />
                <div className="flex justify-between items-center pt-6">
                  <div>
                    {currentStepIndex > 0 && (
                      <Button type="button" onClick={handlePreviousStep} variant="outline" disabled={isSubmittingTextData}>Previous</Button>
                    )}
                  </div>
                  <div className="flex-grow flex justify-center">
                    <Button type="button" onClick={handleSaveDraft} disabled={isSubmittingTextData} variant="secondary">Save and Exit</Button>
                  </div>
                  <div>
                    {!isLastTextualStep && (
                      <Button type="button" onClick={handleNextStep} disabled={isSubmittingTextData}>Next</Button>
                    )}
                    {isLastTextualStep && (
                      <Button type="submit" disabled={isSubmittingTextData || authLoading || birLoading}>
                        {isSubmittingTextData ? 'Saving...' : ((fetchedBir && fetchedBir.id && !textDataSubmittedSuccessfully) || (fetchedBir && fetchedBir.id && currentStepIndex !== 0)) ? 'Update & Save All Answers' : 'Save All Answers'}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100">
        <header className="sticky top-0 z-[61] flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/80 backdrop-blur-sm sm:px-6">
          <h1 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Business Information Request
          </h1>
          <button
            onClick={handleCloseOverlay}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </header>
        {/* The internalFormContent handles its own scrolling for the form area if needed */}
        {internalFormContent} 
      </div>
    );
  }

  // Render inline if not editing (handles its own padding and card-like appearance)
  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
        {internalFormContent}
    </div>
  );
} 