'use client';

import { useBir } from './useBir';
import { birInsertSchema, birUpdateSchema, birAnswersSchema, BirAnswersData } from '@/lib/validation/bir';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { BirRow } from '@/lib/types/bir';
import { BirUpdateDTO } from '@/lib/validation/bir';

// Type for the form values, matching the insert schema exactly
type FormValues = z.infer<typeof birInsertSchema>;

// Type guard to check if answers is a valid object (basic check)
function isValidAnswersObject(answers: any): answers is Partial<BirAnswersData> {
    return typeof answers === 'object' && answers !== null && !Array.isArray(answers);
}

// Helper to get default values for the complex answers object
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

interface BirFormProps {
    projectId: string;
}

/**
 * Form for Clients to submit or update their Business Information Request.
 */
export default function BirForm({ projectId }: BirFormProps) {
    const { bir: fetchedBir, mutate, isLoading, error } = useBir(projectId);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const isUpdateMode = !!fetchedBir;

    const form = useForm<FormValues>({
        resolver: zodResolver(birInsertSchema),
        defaultValues: {
            project_id: projectId,
            project_type: 'web_design',
            client_id: '', // Server sets this
            answers: getDefaultAnswers(),
        },
    });

    // Effect to set form values when BIR data is fetched
    useEffect(() => {
        if (fetchedBir && isValidAnswersObject(fetchedBir.answers)) {
            // Merge fetched answers with defaults to ensure all fields are present
            const mergedAnswers = { ...getDefaultAnswers(), ...fetchedBir.answers }; 
            form.reset({
                project_id: fetchedBir.project_id,
                client_id: fetchedBir.client_id || '',
                project_type: 'web_design',
                // Ensure all expected answer fields are set, even if null/undefined in DB
                answers: {
                    official_company_name: mergedAnswers.official_company_name || '',
                    official_company_phone: mergedAnswers.official_company_phone || '',
                    official_company_email: mergedAnswers.official_company_email || '',
                    official_company_address: mergedAnswers.official_company_address || '',
                    email: mergedAnswers.email || '',
                    website_url: mergedAnswers.website_url || '',
                    facebook_url: mergedAnswers.facebook_url || '',
                    instagram_url: mergedAnswers.instagram_url || '',
                    // TODO: Handle array fields like other_social_links appropriately for form display if needed
                    other_social_links: Array.isArray(mergedAnswers.other_social_links) ? mergedAnswers.other_social_links : [],
                    services_description: mergedAnswers.services_description || '',
                    company_history_mission: mergedAnswers.company_history_mission || '',
                    team_member_profiles: mergedAnswers.team_member_profiles || '',
                    certifications_testimonials_case_studies: mergedAnswers.certifications_testimonials_case_studies || '',
                    partnerships_affiliations: mergedAnswers.partnerships_affiliations || '',
                    faqs_key_information: mergedAnswers.faqs_key_information || '',
                    specific_features_requests: mergedAnswers.specific_features_requests || '',
                    additional_comments: mergedAnswers.additional_comments || '',
                },
            });
        } else if (!isLoading && !error && !fetchedBir) {
            // Reset to default empty form if no BIR exists
            form.reset({
                project_id: projectId,
                project_type: 'web_design',
                client_id: '',
                answers: getDefaultAnswers(),
            });
        }
    }, [fetchedBir, projectId, isLoading, error, form]);

    if (isLoading) return <p>Loading Business Information Form...</p>;
    if (error) return <p className="text-red-600">Error loading form: {error.message}</p>;

    if (fetchedBir && fetchedBir.status === 'approved') {
        return <p className="text-yellow-600">This request has been approved and cannot be edited.</p>;
    }

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        console.log('--- onSubmit triggered ---');
        setIsSaving(true);
        const method = isUpdateMode ? 'PATCH' : 'POST';
        let payload: any;
        console.log('Method:', method);

        try {
            const processedAnswers = values.answers;
            console.log('Processed Answers (from form values):', processedAnswers);

            // TODO: Handle file uploads separately - get file refs/paths to include here if needed

            if (isUpdateMode && fetchedBir) {
                const updatePayload: BirUpdateDTO = {
                    id: fetchedBir.id,
                    answers: processedAnswers,
                };
                console.log('Payload before PATCH validation:', updatePayload);
                const validationResult = birUpdateSchema.safeParse(updatePayload);
                if (!validationResult.success) {
                    console.error('PATCH Validation failed:', validationResult.error.flatten());
                    const errorMessages = Object.entries(validationResult.error.flatten().fieldErrors)
                        .map(([field, messages]) => `${field}: ${messages?.join(', ') || 'Invalid'}`)
                        .join('\n');
                    toast({ title: "Validation Error", description: errorMessages || "Invalid data for update.", variant: "destructive" });
                    setIsSaving(false);
                    return;
                }
                payload = validationResult.data;
            } else {
                const insertPayload = {
                    project_id: values.project_id,
                    client_id: values.client_id, // Will be ignored, but schema expects it
                    project_type: values.project_type,
                    answers: processedAnswers,
                };
                console.log('Payload before POST validation:', insertPayload);
                const validationResult = birInsertSchema.safeParse(insertPayload);
                if (!validationResult.success) {
                    console.error('POST Validation failed:', validationResult.error.flatten());
                    const errorMessages = Object.entries(validationResult.error.flatten().fieldErrors)
                        .map(([field, messages]) => `${field}: ${messages?.join(', ') || 'Invalid'}`)
                        .join('\n');
                    toast({ title: "Validation Error", description: errorMessages || "Invalid data for submission.", variant: "destructive" });
                     setIsSaving(false);
                     return;
                }
                const { client_id, ...finalPayload } = validationResult.data;
                payload = finalPayload;
            }

            console.log('Payload validated, attempting fetch...', payload);

            // --- API Call ---
            const res = await fetch('/api/bir', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            console.log('Fetch response status:', res.status);

            const result = await res.json();
            console.log('Fetch response body:', result);

            if (!res.ok) {
                console.error('API Error Response:', result);
                throw new Error(result.error || 'Save failed');
            }
            toast({ title: "Success", description: `Business information ${isUpdateMode ? 'updated' : 'submitted'}.` });
            await mutate();
        } catch (error: any) {
            console.error('Error during onSubmit:', error);
            toast({ title: "Error", description: error.message || 'An unexpected error occurred.', variant: "destructive" });
        } finally {
            console.log('--- onSubmit finished ---');
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-6">Business Information Request</h3>

            {/* Global form error display */}
            {form.formState.errors.root?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

             {/* Official Company Info Section */}
             <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Official Company Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Official Company Name */}
                     <div className="space-y-1">
                         <Label htmlFor="official_company_name">Official Company Name *</Label>
                         <Input id="official_company_name" {...form.register('answers.official_company_name')} disabled={isSaving || isLoading} />
                         {form.formState.errors.answers?.official_company_name && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.official_company_name.message}</p>}
                     </div>
                     {/* Official Company Phone */}
                    <div className="space-y-1">
                        <Label htmlFor="official_company_phone">Official Phone *</Label>
                        <Input id="official_company_phone" {...form.register('answers.official_company_phone')} disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.official_company_phone && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.official_company_phone.message}</p>}
                    </div>
                    {/* Official Company Email */}
                    <div className="space-y-1">
                        <Label htmlFor="official_company_email">Official Email *</Label>
                        <Input id="official_company_email" type="email" {...form.register('answers.official_company_email')} disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.official_company_email && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.official_company_email.message}</p>}
                    </div>
                    {/* Official Company Address */}
                    <div className="space-y-1">
                        <Label htmlFor="official_company_address">Official Street Address *</Label>
                        <Input id="official_company_address" {...form.register('answers.official_company_address')} disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.official_company_address && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.official_company_address.message}</p>}
                    </div>
                 </div>
             </fieldset>

            {/* Contact & Online Presence Section */}
            <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Contact & Online Presence</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* General Email */}
                    <div className="space-y-1">
                        <Label htmlFor="email">General Contact Email *</Label>
                        <Input id="email" type="email" {...form.register('answers.email')} disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.email && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.email.message}</p>}
                    </div>
                     {/* Website URL */}
                    <div className="space-y-1">
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input id="website_url" type="url" {...form.register('answers.website_url')} placeholder="https://..." disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.website_url && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.website_url.message}</p>}
                    </div>
                    {/* Facebook URL */}
                    <div className="space-y-1">
                        <Label htmlFor="facebook_url">Facebook URL</Label>
                        <Input id="facebook_url" type="url" {...form.register('answers.facebook_url')} placeholder="https://facebook.com/..." disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.facebook_url && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.facebook_url.message}</p>}
                    </div>
                    {/* Instagram URL */}
                    <div className="space-y-1">
                        <Label htmlFor="instagram_url">Instagram URL</Label>
                        <Input id="instagram_url" type="url" {...form.register('answers.instagram_url')} placeholder="https://instagram.com/..." disabled={isSaving || isLoading} />
                        {form.formState.errors.answers?.instagram_url && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.instagram_url.message}</p>}
                    </div>
                </div>
                 {/* Other Social Links TODO: Implement better input (e.g., dynamic list) */} 
                 <div className="space-y-1">
                     <Label htmlFor="other_social_links">Other Social Links (Enter full URLs, one per line)</Label>
                     <Textarea 
                        id="other_social_links" 
                        {...form.register('answers.other_social_links', { 
                            setValueAs: (v) => typeof v === 'string' ? v.split('\n').map(s => s.trim()).filter(Boolean) : [],
                            // value: Array.isArray(form.getValues('answers.other_social_links')) ? form.getValues('answers.other_social_links').join('\n') : '' 
                         })}
                        rows={3}
                        placeholder="https://linkedin.com/company/...
https://twitter.com/..." 
                        disabled={isSaving || isLoading} 
                    />
                    {form.formState.errors.answers?.other_social_links && <p className="text-sm text-destructive pt-1">Please enter valid URLs, one per line.</p>} 
                    {/* Custom message as default array error might not be helpful */} 
                 </div>
             </fieldset>

            {/* Company Details Section */}
             <fieldset className="space-y-4 border p-4 rounded-md">
                 <legend className="text-lg font-semibold px-2">Company Details</legend>
                {/* Services Description */}
                <div className="space-y-1">
                    <Label htmlFor="services_description">Detailed Description of Services Provided *</Label>
                    <Textarea id="services_description" {...form.register('answers.services_description')} rows={5} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.services_description && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.services_description.message}</p>}
                </div>
                {/* Company History/Mission */}
                <div className="space-y-1">
                    <Label htmlFor="company_history_mission">Company History and Mission Statement *</Label>
                    <Textarea id="company_history_mission" {...form.register('answers.company_history_mission')} rows={5} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.company_history_mission && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.company_history_mission.message}</p>}
                </div>
                {/* Team Member Profiles */}
                <div className="space-y-1">
                    <Label htmlFor="team_member_profiles">Profiles of Key Team Members (if applicable)</Label>
                    <Textarea id="team_member_profiles" {...form.register('answers.team_member_profiles')} rows={4} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.team_member_profiles && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.team_member_profiles.message}</p>}
                </div>
             </fieldset>

            {/* Supporting Information Section */}
            <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Supporting Information</legend>
                {/* Certs/Testimonials/Case Studies */}
                <div className="space-y-1">
                    <Label htmlFor="certs_testimonials_case_studies">Certifications, Client Testimonials, or Specific Case Studies</Label>
                    <Textarea id="certs_testimonials_case_studies" {...form.register('answers.certifications_testimonials_case_studies')} rows={4} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.certifications_testimonials_case_studies && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.certifications_testimonials_case_studies.message}</p>}
                </div>
                {/* Partnerships/Affiliations */}
                <div className="space-y-1">
                    <Label htmlFor="partnerships_affiliations">Partnerships and Affiliations</Label>
                    <Textarea id="partnerships_affiliations" {...form.register('answers.partnerships_affiliations')} rows={3} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.partnerships_affiliations && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.partnerships_affiliations.message}</p>}
                </div>
                {/* FAQs/Key Info */}
                <div className="space-y-1">
                    <Label htmlFor="faqs_key_info">FAQs or Key Information Frequently Requested by Clients</Label>
                    <Textarea id="faqs_key_info" {...form.register('answers.faqs_key_information')} rows={4} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.faqs_key_information && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.faqs_key_information.message}</p>}
                </div>
            </fieldset>

            {/* Website Specifics & Files Section */} 
             <fieldset className="space-y-4 border p-4 rounded-md">
                 <legend className="text-lg font-semibold px-2">Website Specifics & Files</legend>
                {/* Specific Features */}
                <div className="space-y-1">
                    <Label htmlFor="specific_features_requests">Specific Features/Functions for Website (offers, disclaimers, etc)</Label>
                    <Textarea id="specific_features_requests" {...form.register('answers.specific_features_requests')} rows={4} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.specific_features_requests && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.specific_features_requests.message}</p>}
                </div>
                 {/* File Uploads - TODO */} 
                 <div className="space-y-2">
                     <Label>File Uploads</Label>
                     <div className="p-4 border border-dashed rounded-md bg-muted/50">
                         <p className="text-sm text-muted-foreground">TODO: Integrate file upload components here for:</p>
                         <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                            <li>Logos</li>
                            <li>Brand Style Guides</li>
                            <li>Product or Business Photos</li>
                             <li>Certifications/Licenses (PDF, JPG)</li>
                         </ul>
                         <p className="text-sm text-muted-foreground mt-2">Use the general file upload section below for now.</p>
                     </div>
                 </div>
            </fieldset>

            {/* Additional Comments Section */}
            <fieldset className="space-y-4 border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Final Comments</legend>
                {/* Additional Comments */}
                <div className="space-y-1">
                    <Label htmlFor="additional_comments">Additional Comments or Requests</Label>
                    <Textarea id="additional_comments" {...form.register('answers.additional_comments')} rows={4} disabled={isSaving || isLoading} />
                    {form.formState.errors.answers?.additional_comments && <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.additional_comments.message}</p>}
                </div>
            </fieldset>

            <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? 'Saving...' : isUpdateMode ? 'Update Information' : 'Submit Information'}
            </Button>
        </form>
    );
} 