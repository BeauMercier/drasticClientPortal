'use client';

import { useBir } from './useBir';
import { birInsertSchema, birUpdateSchema, birAnswersSchema } from '@/lib/validation/bir';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { BirRow } from '@/lib/types/bir';
import { BirUpdateDTO } from '@/lib/validation/bir';

// Type for the structured answers object
type BirAnswers = z.infer<typeof birAnswersSchema>;

// Type for the form values - directly infer from the insert schema
// We will manage the string/array conversion for colours manually
type FormValues = z.infer<typeof birInsertSchema>;

// Type guard to check if answers is a valid object
function isValidAnswersObject(answers: any): answers is BirAnswers {
    // Basic check, refine if needed based on actual JSONB structure possibilities
    return typeof answers === 'object' && answers !== null && !Array.isArray(answers);
}

interface BirFormProps {
    projectId: string;
}

/**
 * Form for Clients to submit or update their Business Information Request.
 *
 * Props:
 *  - projectId: UUID of the associated web design project.
 */
export default function BirForm({ projectId }: BirFormProps) {
    const { bir: fetchedBir, mutate, isLoading, error } = useBir(projectId);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Determine if we are updating an existing record based on fetched data
    const isUpdateMode = !!fetchedBir;

    const form = useForm<FormValues>({
        // Use the original insert schema for form structure and basic validation
        // The resolver might flag the colours array as invalid initially if passed a string,
        // but we handle the final validation logic in onSubmit.
        resolver: zodResolver(birInsertSchema),
        defaultValues: {
            project_id: projectId,
            project_type: 'web_design',
            client_id: '', // Server sets this
            answers: { business_name: '', industry: '', colours: [] }, // Default colours as empty array
        },
    });

    // Effect to set form values when BIR data is fetched
    useEffect(() => {
        if (fetchedBir && isValidAnswersObject(fetchedBir.answers)) {
            form.setValue('project_id', fetchedBir.project_id);
            form.setValue('client_id', fetchedBir.client_id || ''); // Should exist
            form.setValue('answers.business_name', fetchedBir.answers.business_name || '');
            form.setValue('answers.industry', fetchedBir.answers.industry || '');
            // Set the input value as a comma-separated string
            form.setValue('answers.colours', Array.isArray(fetchedBir.answers.colours)
                ? fetchedBir.answers.colours.join(', ')
                : '' as any); // Cast needed as form expects string[] based on schema
        } else if (!isLoading && !error && !fetchedBir) {
             // Reset to default empty form if no BIR exists
             form.reset({
                project_id: projectId,
                project_type: 'web_design',
                client_id: '',
                answers: { business_name: '', industry: '', colours: [] },
            });
             // Explicitly reset colours input field too if needed
             form.setValue('answers.colours', '' as any); 
        }
    }, [fetchedBir, projectId, isLoading, error, form.setValue, form.reset]);

    if (isLoading) return <p>Loading Business Information Form...</p>;
    if (error) return <p className="text-red-600">Error loading form: {error.message}</p>;

    if (fetchedBir && fetchedBir.status === 'approved') {
        return <p className="text-yellow-600">This request has been approved and cannot be edited.</p>;
        // Or: return <BirSummary bir={fetchedBir} />; // Requires import
    }

    // Get the raw string value from the colours input field
    const colourInputString = form.watch('answers.colours') as any as string; // Watch the input value

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        setIsSaving(true);
        const method = isUpdateMode ? 'PATCH' : 'POST';
        let payload: any;

        // Convert the colour string from input back to array for validation/processing
        const coloursArray = typeof colourInputString === 'string'
            ? colourInputString.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        // Construct the answers object with the correct array type for colours
        const processedAnswers: BirAnswers = {
            business_name: values.answers.business_name,
            industry: values.answers.industry,
            colours: coloursArray,
        };

        if (isUpdateMode && fetchedBir) {
            // Construct the update DTO with processed answers
            const updatePayload: BirUpdateDTO = {
                id: fetchedBir.id,
                answers: processedAnswers,
            };

            // **Validate the final Update DTO**
            const validationResult = birUpdateSchema.safeParse(updatePayload);
            if (!validationResult.success) {
                const errorMessages = Object.entries(validationResult.error.flatten().fieldErrors)
                    .map(([field, messages]) => `${field}: ${messages?.join(', ') || 'Invalid'}`)
                    .join('\n');
                toast({ title: "Validation Error", description: errorMessages || "Invalid data for update.", variant: "destructive" });
                setIsSaving(false);
                return;
            }
            payload = validationResult.data;
        } else {
            // Construct the insert DTO with processed answers
            const insertPayload = {
                project_id: values.project_id,
                client_id: values.client_id, // Will be ignored by server, but needed for validation
                project_type: values.project_type,
                answers: processedAnswers,
            };

            // **Validate the final Insert DTO**
            const validationResult = birInsertSchema.safeParse(insertPayload);
            if (!validationResult.success) {
                const errorMessages = Object.entries(validationResult.error.flatten().fieldErrors)
                    .map(([field, messages]) => `${field}: ${messages?.join(', ') || 'Invalid'}`)
                    .join('\n');
                toast({ title: "Validation Error", description: errorMessages || "Invalid data for submission.", variant: "destructive" });
                setIsSaving(false);
                return;
            }
            // Remove client_id before sending POST request
            const { client_id, ...finalPayload } = validationResult.data;
            payload = finalPayload;
        }

        // Send to API...
        try {
            const res = await fetch('/api/bir', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Save failed');
            }

            toast({
                title: "Success",
                description: `Business information ${isUpdateMode ? 'updated' : 'submitted'}.`,
            });
            await mutate();

        } catch (error: any) {
            console.error('Save failed:', error);
            toast({
                title: "Error",
                description: error.message || 'An unexpected error occurred.',
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>

            {/* Global form error display (if refine is used on schema) */}
            {form.formState.errors.root?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <div className="space-y-4">
                {/* Business Name Field */}
                <div className="space-y-1">
                    <Label htmlFor="business_name">Business name</Label>
                    <Input
                        id="business_name"
                        {...form.register('answers.business_name')}
                        disabled={isSaving || isLoading}
                        aria-invalid={form.formState.errors.answers?.business_name ? "true" : "false"}
                    />
                    {form.formState.errors.answers?.business_name && (
                        <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.business_name.message}</p>
                    )}
                </div>

                {/* Industry Field */}
                <div className="space-y-1">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                        id="industry"
                        {...form.register('answers.industry')}
                        disabled={isSaving || isLoading}
                         aria-invalid={form.formState.errors.answers?.industry ? "true" : "false"}
                   />
                    {form.formState.errors.answers?.industry && (
                        <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.industry.message}</p>
                    )}
                </div>

                {/* Colours Field */}
                <div className="space-y-1">
                    <Label htmlFor="colours">Brand colours (comma-separated)</Label>
                    <Input
                        id="colours"
                        // Registering name that matches schema (expecting string[])
                        // but the actual input value is managed via setValue/watch
                        {...form.register('answers.colours')}
                        // Use defaultValue to set initial string value from state if needed
                         defaultValue={colourInputString} // Set initial display value
                         onChange={(e) => form.setValue('answers.colours', e.target.value as any)} // Update form state on change
                        placeholder="e.g., #FF0000, Blue, green"
                        disabled={isSaving || isLoading}
                        // Error state might be tricky here due to type mismatch
                         aria-invalid={form.formState.errors.answers?.colours ? "true" : "false"}
                   />
                    {form.formState.errors.answers?.colours && (
                        <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.colours.message}</p>
                    )}
                </div>

                {/* TODO: Add other fields based on birAnswersSchema using appropriate shadcn components */}
            </div>

            <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : isUpdateMode ? 'Update Information' : 'Submit Information'}
            </Button>
        </form>
    );
} 