'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from '@/lib/validation/bir';

interface WebsiteSpecificsStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
}

/**
 * Renders the website specifics step in the BIR multi-step form.
 *
 * @param {WebsiteSpecificsStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The website specifics step component.
 */
export default function WebsiteSpecificsStep({ form, isSubmitting }: WebsiteSpecificsStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      <legend className="text-lg font-semibold px-2">Website Specifics</legend>
      {/* Specific Features */}
      <div className="space-y-1">
        <Label htmlFor="specific_features_requests">
          Specific Features/Functions for Website (offers, disclaimers, etc)
        </Label>
        <Textarea
          id="specific_features_requests"
          {...form.register('answers.specific_features_requests')}
          rows={4}
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.specific_features_requests && (
          <p className="text-sm text-destructive pt-1">
            {form.formState.errors.answers.specific_features_requests.message}
          </p>
        )}
      </div>
    </fieldset>
  );
} 