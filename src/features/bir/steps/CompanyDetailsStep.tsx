'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from '@/lib/validation/bir'; // New import

interface CompanyDetailsStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
}

/**
 * Renders the company details step in the BIR multi-step form.
 *
 * @param {CompanyDetailsStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The company details step component.
 */
export default function CompanyDetailsStep({ form, isSubmitting }: CompanyDetailsStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      <legend className="text-lg font-semibold px-2">Company Details</legend>
      {/* Services Description */}
      <div className="space-y-1">
        <Label htmlFor="services_description">Detailed Description of Services Provided *</Label>
        <Textarea 
          id="services_description" 
          {...form.register('answers.services_description')} 
          rows={5} 
          disabled={isSubmitting} 
        />
        {form.formState.errors.answers?.services_description && 
          <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.services_description.message}</p>}
      </div>
      {/* Company History/Mission */}
      <div className="space-y-1">
        <Label htmlFor="company_history_mission">Company History and Mission Statement *</Label>
        <Textarea 
          id="company_history_mission" 
          {...form.register('answers.company_history_mission')} 
          rows={5} 
          disabled={isSubmitting} 
        />
        {form.formState.errors.answers?.company_history_mission && 
          <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.company_history_mission.message}</p>}
      </div>
      {/* Team Member Profiles */}
      <div className="space-y-1">
        <Label htmlFor="team_member_profiles">Profiles of Key Team Members (if applicable)</Label>
        <Textarea 
          id="team_member_profiles" 
          {...form.register('answers.team_member_profiles')} 
          rows={4} 
          disabled={isSubmitting} 
        />
        {form.formState.errors.answers?.team_member_profiles && 
          <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.team_member_profiles.message}</p>}
      </div>
    </fieldset>
  );
} 