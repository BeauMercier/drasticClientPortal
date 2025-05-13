'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from '@/lib/validation/bir';

interface SupportingInfoStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
}

/**
 * Renders the supporting information step in the BIR multi-step form.
 *
 * @param {SupportingInfoStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The supporting information step component.
 */
export default function SupportingInfoStep({ form, isSubmitting }: SupportingInfoStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      <legend className="text-lg font-semibold px-2">Supporting Information</legend>
      {/* Certs/Testimonials/Case Studies */}
      <div className="space-y-1">
        <Label htmlFor="certs_testimonials_case_studies">
          Certifications, Client Testimonials, or Specific Case Studies
        </Label>
        <Textarea
          id="certs_testimonials_case_studies"
          {...form.register('answers.certifications_testimonials_case_studies')}
          rows={4}
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.certifications_testimonials_case_studies && (
          <p className="text-sm text-destructive pt-1">
            {form.formState.errors.answers.certifications_testimonials_case_studies.message}
          </p>
        )}
      </div>
      {/* Partnerships/Affiliations */}
      <div className="space-y-1">
        <Label htmlFor="partnerships_affiliations">Partnerships and Affiliations</Label>
        <Textarea
          id="partnerships_affiliations"
          {...form.register('answers.partnerships_affiliations')}
          rows={3}
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.partnerships_affiliations && (
          <p className="text-sm text-destructive pt-1">
            {form.formState.errors.answers.partnerships_affiliations.message}
          </p>
        )}
      </div>
      {/* FAQs/Key Info */}
      <div className="space-y-1">
        <Label htmlFor="faqs_key_info">FAQs or Key Information Frequently Requested by Clients</Label>
        <Textarea
          id="faqs_key_info"
          {...form.register('answers.faqs_key_information')}
          rows={4}
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.faqs_key_information && (
          <p className="text-sm text-destructive pt-1">
            {form.formState.errors.answers.faqs_key_information.message}
          </p>
        )}
      </div>
    </fieldset>
  );
} 