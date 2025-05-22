'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FieldErrors, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyedMutator } from 'swr';
import { clsx } from 'clsx';
// import { XMarkIcon } from "@heroicons/react/24/outline";
// import { CheckCircle2 } from "lucide-react";

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
import { birStepsConfig, StepProps } from './birStepConfig';
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

  const textualSteps = birStepsConfig;
  const isLastTextualStep = currentStepIndex === textualSteps.length - 1;

  const isApproved = fetchedBir && fetchedBir.status === 'approved';
  const isEditing = !isApproved;

  useEffect(() => {
    if (isEditing) {
      // For now, let's assume if editing, we might still want scroll lock if it was part of an older design even for inline
      // document.body.classList.add("overflow-hidden");
    } else {
      // document.body.classList.remove("overflow-hidden");
    }
    // return () => document.body.classList.remove("overflow-hidden");
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
    if (isEditing) {
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
  }, [fetchedBir, projectId, birLoading, birError, user, form, isEditing]);

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
      await parentMutateBir();
      await localMutateBir();
      if (onSaveAndExit) {
        onSaveAndExit(result.id);
      }
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

  if (isApproved) {
    return (
      <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
        <div className="mb-10 flex items-start justify-center space-x-6 sm:space-x-10 overflow-x-auto pb-4 pt-2">
          {textualSteps.map((step) => (
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
  
  if (authLoading || (birLoading && !fetchedBir)) return <p>Loading Business Information Form...</p>;
  if (birError && !fetchedBir) return <p className="text-red-600">Error loading form data: {birError.message}</p>;
  if (!user) return <p className="text-red-600">Error: User not found. Cannot display form.</p>;
  
  const CurrentStepComponent = textualSteps[currentStepIndex].component as React.ComponentType<StepProps>;

  const internalFormContent = (
    <>
      {isEditing && (
        <div className="md:hidden px-4 mt-10">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Step {currentStepIndex + 1} of {textualSteps.length}
          </p>
          <h2 className="mt-1 text-base font-medium text-primary-600 dark:text-primary-400">
            {textualSteps[currentStepIndex].name}
          </h2>
        </div>
      )}

      <div
        className={clsx(
          "mt-6 px-4 md:px-6 pb-4 overflow-x-auto",
          !isEditing && "opacity-50 pointer-events-none",
          {
             "flex mb-10 space-x-4 md:space-x-6": !isEditing,
             "hidden md:flex w-full justify-around border-t border-gray-200 dark:border-gray-700": isEditing
          }
        )}
      >
        {textualSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = !isCompleted && index === currentStepIndex;
          
          let stepStyle = 'bg-muted text-muted-foreground border-gray-300'; // Upcoming
          if (isCompleted) {
            stepStyle = 'bg-green-500 text-white border-green-600';
          }
          if (isActive) {
            stepStyle = 'bg-primary text-primary-foreground scale-110 border-primary-dark ring-2 ring-primary-focus ring-offset-2 ring-offset-card';
          }

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 px-1">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ease-in-out border-2 ${stepStyle}`}
              >
                {index + 1}
              </div>
              <span className="mt-1 block text-[11px] leading-tight truncate">
                {step.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className={clsx(
          "px-4 sm:px-6 pt-2"
        )}
      >
        <div className=""> 
          {!isApproved && (
            <>
              <form onSubmit={form.handleSubmit(handleSubmitAllAnswers, onFormError)} className="space-y-6">
                <CurrentStepComponent form={form} isSubmitting={isSubmittingTextData || authLoading || birLoading} />
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {currentStepIndex > 0 && (
                      <Button
                        type="button"
                        onClick={handlePreviousStep}
                        variant="outline"
                        disabled={isSubmittingTextData}
                        className="w-full sm:w-auto whitespace-normal"
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-center sm:flex-grow">
                    <Button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSubmittingTextData}
                      variant="secondary"
                      className="w-full sm:w-auto whitespace-normal"
                    >
                      Save and Exit
                    </Button>
                  </div>
                  <div>
                    {!isLastTextualStep && (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isSubmittingTextData}
                        className="w-full sm:w-auto whitespace-normal"
                      >
                        Next
                      </Button>
                    )}
                    {isLastTextualStep && (
                      <Button
                        type="submit"
                        disabled={isSubmittingTextData || authLoading || birLoading}
                        className="w-full sm:w-auto whitespace-normal"
                      >
                        {isSubmittingTextData ? 'Saving...' : ((fetchedBir && fetchedBir.id && currentStepIndex !== 0)) ? 'Update & Save All Answers' : 'Save All Answers'}
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

  const inlineModeWrapperClasses = "space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground";

  return (
    <div className={inlineModeWrapperClasses}>
      {internalFormContent} 
    </div>
  );
} 