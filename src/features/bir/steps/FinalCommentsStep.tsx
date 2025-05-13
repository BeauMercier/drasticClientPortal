'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from '@/lib/validation/bir';

interface FinalCommentsStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
}

/**
 * Renders the final comments step in the BIR multi-step form.
 *
 * @param {FinalCommentsStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The final comments step component.
 */
export default function FinalCommentsStep({ form, isSubmitting }: FinalCommentsStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      <legend className="text-lg font-semibold px-2">Final Comments</legend>
      {/* Additional Comments */}
      <div className="space-y-1">
        <Label htmlFor="additional_comments">Additional Comments or Requests</Label>
        <Textarea
          id="additional_comments"
          {...form.register('answers.additional_comments')}
          rows={4}
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.additional_comments && (
          <p className="text-sm text-destructive pt-1">
            {form.formState.errors.answers.additional_comments.message}
          </p>
        )}
      </div>
    </fieldset>
  );
} 