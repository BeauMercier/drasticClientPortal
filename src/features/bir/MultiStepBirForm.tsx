'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, FieldErrors, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyedMutator } from 'swr';

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

  // Filter out FileUploadStep initially from the textual steps
  // const textualSteps = birStepsConfig.filter(step => step.id !== 'fileUpload');
  // Let's assume for now birStepsConfig only contains textual steps
  const textualSteps = birStepsConfig; 
  const isLastTextualStep = currentStepIndex === textualSteps.length - 1;

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

    if (birLoading) return; // Don't do anything until bir data is loaded or confirmed not present

    // DO NOT set textDataSubmittedSuccessfully here when just loading a draft or existing data.
    // This state should only be true after a successful SUBMIT operation via handleSubmitAllAnswers.
    // if (fetchedBir && !form.formState.isDirty && !textDataSubmittedSuccessfully && shouldInitializeTextDataSubmitted) {
    //   setTextDataSubmittedSuccessfully(true);
    // }
    
    // Form reset logic
    // Only reset/populate if not in summary view OR if user clicked edit (which sets textDataSubmittedSuccessfully to false).
    if (!textDataSubmittedSuccessfully) { 
      if (fetchedBir && isValidAnswersObject(fetchedBir.answers)) {
        const mergedAnswers = { ...getDefaultAnswers(), ...fetchedBir.answers };
        form.reset({
          project_id: fetchedBir.project_id,
          client_id: user?.id || fetchedBir.client_id || '',
          project_type: 'web_design',
          answers: mergedAnswers,
        }, { keepValues: form.formState.isDirty }); // Preserve dirty fields if user was editing
      } else if (!birError && !fetchedBir && user?.id) { // No fetchedBir, but user exists (new form)
        form.reset({
          project_id: projectId,
          project_type: 'web_design',
          client_id: user.id,
          answers: getDefaultAnswers(),
        });
      }
    }
  }, [fetchedBir, projectId, birLoading, birError, user, form, textDataSubmittedSuccessfully]); // Added textDataSubmittedSuccessfully back to deps

  const handleNextStep = async () => {
    const currentStepFields = textualSteps[currentStepIndex].fields;
    // Need to cast field names to Path<BirFormValues> for trigger
    const fieldsToValidate = currentStepFields.map(field => `answers.${field}` as Path<BirFormValues>);

    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);
    if (isValid) {
      if (!isLastTextualStep) {
        setCurrentStepIndex((prev) => prev + 1);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please check the current step for errors before proceeding.",
        variant: "destructive",
      });
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
        // Update existing BIR as a draft
        const updatePayload: BirUpdateDTO = {
          id: fetchedBir.id,
          answers: pruneEmptyStrings(currentValues.answers ?? {}), // Prune empty strings here too
          status: 'pending',
        };
        const validationResult = birUpdateSchema.safeParse(updatePayload);
        if (!validationResult.success) {
          console.error("Draft update validation error:", validationResult.error.flatten());
          throw new Error('Validation failed when saving draft.');
        }

        const res = await fetch('/api/bir', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validationResult.data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to save draft.');
        savedBirId = result.id;
        toast({ title: "Draft Saved", description: "Your progress has been saved as a draft." });
      } else {
        // Create new BIR as a draft
        const insertPayload: BirInsertDTO = {
          project_id: projectId,
          client_id: user?.id || '', // Ensure client_id is set
          project_type: 'web_design',
          answers: pruneEmptyStrings(currentValues.answers ?? {}), // Prune empty strings from answers
          status: 'pending', // Add status for new drafts
        };

        // Validate specifically for insert, potentially with a more lenient schema if needed for drafts
        const basicInsertSchema = z.object({
          project_id: z.string().uuid(),
          client_id: z.string().uuid(),
          project_type: z.literal('web_design'),
          // answers is intentionally z.any() here for the draft to avoid frontend deep validation issues.
          // Backend will validate answers more strictly.
          answers: z.any(), 
          status: birStatusSchema.optional(), // Use imported birStatusSchema for draft validation
        });

        const validationResult = basicInsertSchema.safeParse(insertPayload);
        if (!validationResult.success) {
          console.error("Draft insert basic validation error (frontend):", validationResult.error.flatten());
          const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
          throw new Error(`Basic validation failed: ${errorMessages}`);
        }

        // Send the validated basic payload (which includes potentially incomplete/invalid answers for a draft)
        const res = await fetch('/api/bir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validationResult.data), // Send validated data (answers still as is)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to save draft.'); // Changed error message
        savedBirId = result.id;
        toast({ title: "Draft Saved", description: "Your progress has been saved as a draft." }); // Changed toast message
      }

      await parentMutateBir(); // Revalidate BIR data globally
      await localMutateBir();  // Revalidate local BIR data state
      if (onSaveAndExit) {
        onSaveAndExit(savedBirId);
      }
    } catch (error: any) {
      console.error("Error in handleSaveDraft:", error);
      toast({
        title: "Error Saving",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTextData(false);
    }
  };

  const handleSubmitAllAnswers: SubmitHandler<BirFormValues> = async (values) => {
    setIsSubmittingTextData(true);
    // Determine if it's an update or new submission based on fetchedBir's state *before* this submission attempt.
    const isUpdateMode = !!(fetchedBir && fetchedBir.id);
    const method = isUpdateMode ? 'PATCH' : 'POST';
    let payload: any;

    try {
      const processedAnswers = values.answers;
      if (isUpdateMode && fetchedBir) {
        const updatePayload: BirUpdateDTO = { 
          id: fetchedBir.id, 
          answers: processedAnswers,
          status: 'submitted' // Explicitly set status to 'submitted'
        };
        const validationResult = birUpdateSchema.safeParse(updatePayload);
        if (!validationResult.success) {
          console.error("Validation error during update submission:", validationResult.error.flatten());
          throw new Error('Validation failed for update.'); // Simplified error
        }
        payload = validationResult.data;
      } else {
        // For POST (insert), also ensure status is 'submitted'
        const insertPayload: BirInsertDTO = {
          project_id: projectId, // Ensure project_id is from props
          client_id: user?.id || '', // Ensure client_id is from auth or form
          project_type: 'web_design', // Ensure project_type
          answers: processedAnswers, // Use processedAnswers
          status: 'submitted' // Explicitly set status to 'submitted'
        };
        const validationResult = birInsertSchema.safeParse(insertPayload);
        if (!validationResult.success) {
          console.error("Validation error during insert submission:", validationResult.error.flatten());
          throw new Error('Validation failed for insert.'); // Simplified error
        }
        payload = validationResult.data;
      }

      const res = await fetch('/api/bir', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');

      toast({ title: "Success", description: `Business information ${isUpdateMode ? 'updated' : 'submitted'}.` });
      setTextDataSubmittedSuccessfully(true);
      await parentMutateBir();
      await localMutateBir();
      // TODO: Potentially advance to FileUploadStep if it exists and this was successful
      // if (birStepsConfig.find(step => step.id === 'fileUpload')) {
      //   const fileUploadStepIndex = birStepsConfig.findIndex(step => step.id === 'fileUpload');
      //   setCurrentStepIndex(fileUploadStepIndex);
      // }
    } catch (error: any) {
      console.error("Error submitting BIR answers:", error);
      toast({ title: "Error", description: error.message || 'An unexpected error occurred.', variant: "destructive" });
    } finally {
      setIsSubmittingTextData(false);
    }
  };

  const onFormError = (errors: FieldErrors<BirFormValues>) => {
    console.error('❌ RHF validation errors →', errors);
    toast({
      title: "Validation Error",
      description: "Please review the form for errors. Check all steps if necessary.",
      variant: "destructive"
    });
  };

  const handleEdit = () => {
    setTextDataSubmittedSuccessfully(false);
    setCurrentStepIndex(0);
    // Form will repopulate via useEffect if fetchedBir exists
  };

  if (authLoading || birLoading) return <p>Loading Business Information Form...</p>;
  if (birError) return <p className="text-red-600">Error loading form data: {birError.message}</p>;
  if (!user) return <p className="text-red-600">Error: User not found. Cannot display form.</p>;
  if (fetchedBir && fetchedBir.status === 'approved') {
    return (
      <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
        {/* Visual Stepper - Still show progress */}
        <div className="mb-10 flex items-start justify-center space-x-6 sm:space-x-10 overflow-x-auto pb-4 pt-2">
          {textualSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-28 sm:w-32">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ease-in-out border-2 bg-green-500 text-white border-green-600`} // All green if approved
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-center text-muted-foreground">{step.name}</p>
            </div>
          ))}
        </div>
        <div className="p-6 text-center bg-green-50 border border-green-200 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-green-700">Information Approved</h3>
          <p className="text-sm text-green-600 mt-1">This business information request has been approved and cannot be edited.</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = textualSteps[currentStepIndex].component as React.ComponentType<StepProps>;

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
      {/* Visual Stepper */}
      <div className="mb-10 flex items-start justify-center space-x-6 sm:space-x-10 overflow-x-auto pb-4 pt-2">
        {textualSteps.map((step, index) => {
          const isCompleted = textDataSubmittedSuccessfully || index < currentStepIndex;
          const isActive = !textDataSubmittedSuccessfully && index === currentStepIndex;
          
          let stepStyle = 'bg-muted text-muted-foreground border-gray-300'; // Upcoming
          if (isCompleted) {
            stepStyle = 'bg-green-500 text-white border-green-600';
          }
          if (isActive) {
            stepStyle = 'bg-primary text-primary-foreground scale-110 border-primary-dark ring-2 ring-primary-focus ring-offset-2 ring-offset-card';
          }

          return (
            <div key={step.id} className="flex flex-col items-center w-28 sm:w-32">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 ease-in-out border-2 ${stepStyle}`}
              >
                {isCompleted && !isActive ? ( // Show checkmark if completed and not also the active step (unless all submitted)
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <p 
                className={`mt-2 text-xs sm:text-sm text-center ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                {step.name}
              </p>
            </div>
          );
        })}
      </div>

      {textDataSubmittedSuccessfully ? (
        <div className="p-6 text-center bg-green-50 border border-green-200 rounded-md">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-green-700">Information Submitted</h3>
          <p className="text-sm text-green-600 mt-1">Your business information has been successfully submitted.</p>
          <p className="text-sm text-muted-foreground mt-1">You can proceed to upload files or edit the information.</p>
          <div className="mt-4 flex justify-center space-x-3">
            <Button onClick={handleEdit} variant="outline">
              Edit Information
            </Button>
            {/* Placeholder for "Proceed to File Upload" button */}
            {/* <Button onClick={handleProceedToFiles}>Upload Files</Button> */}
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-center sm:text-left">{textualSteps[currentStepIndex].name}</h2>
          
          <form onSubmit={form.handleSubmit(handleSubmitAllAnswers, onFormError)} className="space-y-6">
            <CurrentStepComponent form={form} isSubmitting={isSubmittingTextData || authLoading || birLoading} />

            <div className="flex justify-between items-center pt-6">
              <div>
                {currentStepIndex > 0 && (
                  <Button type="button" onClick={handlePreviousStep} variant="outline" disabled={isSubmittingTextData}>
                    Previous
                  </Button>
                )}
              </div>
              
              {/* Centered Save and Exit Button, and Next/Submit on the right */}
              <div className="flex-grow flex justify-center">
                <Button 
                  type="button" 
                  onClick={handleSaveDraft} 
                  disabled={isSubmittingTextData} 
                  variant="secondary" 
                >
                  Save and Exit
                </Button>
              </div>

              <div>
                {!isLastTextualStep && (
                  <Button type="button" onClick={handleNextStep} disabled={isSubmittingTextData}>
                    Next
                  </Button>
                )}
                {isLastTextualStep && (
                  <Button type="submit" disabled={isSubmittingTextData || authLoading || birLoading}>
                    {isSubmittingTextData 
                      ? 'Saving...' 
                      : ( (fetchedBir && fetchedBir.id && !textDataSubmittedSuccessfully) || (fetchedBir && fetchedBir.id && currentStepIndex !== 0) ) // Check if updating existing draft or submitted info
                        ? 'Update & Save All Answers' 
                        : 'Save All Answers'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </>
      )}
      {/* TODO: Render FileUploadStep after text data is submitted and fetchedBir.id exists, potentially triggered from the summary card */}
    </div>
  );
} 