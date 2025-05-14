'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormValues } from '@/lib/validation/bir';

interface OfficialInfoStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean; // Or whatever prop is used for disabling
}

/**
 * Renders the official company information step in the BIR multi-step form.
 *
 * @param {OfficialInfoStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The official company information step component.
 */
export default function OfficialInfoStep({ form, isSubmitting }: OfficialInfoStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      {/* <legend className="text-lg font-semibold px-2">Official Company Information</legend> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Official Company Name */}
        <div className="space-y-1">
          <Label htmlFor="official_company_name">Official Company Name *</Label>
          <Input
            id="official_company_name"
            {...form.register('answers.official_company_name')}
            disabled={isSubmitting}
          />
          {form.formState.errors.answers?.official_company_name && (
            <p className="text-sm text-destructive pt-1">
              {form.formState.errors.answers.official_company_name.message}
            </p>
          )}
        </div>
        {/* Official Company Phone */}
        <div className="space-y-1">
          <Label htmlFor="official_company_phone">Official Phone *</Label>
          <Input
            id="official_company_phone"
            {...form.register('answers.official_company_phone')}
            disabled={isSubmitting}
          />
          {form.formState.errors.answers?.official_company_phone && (
            <p className="text-sm text-destructive pt-1">
              {form.formState.errors.answers.official_company_phone.message}
            </p>
          )}
        </div>
        {/* Official Company Email */}
        <div className="space-y-1">
          <Label htmlFor="official_company_email">Official Email *</Label>
          <Input
            id="official_company_email"
            type="email"
            {...form.register('answers.official_company_email')}
            disabled={isSubmitting}
          />
          {form.formState.errors.answers?.official_company_email && (
            <p className="text-sm text-destructive pt-1">
              {form.formState.errors.answers.official_company_email.message}
            </p>
          )}
        </div>
        {/* Official Company Address */}
        <div className="space-y-1">
          <Label htmlFor="official_company_address">Official Street Address *</Label>
          <Input
            id="official_company_address"
            {...form.register('answers.official_company_address')}
            disabled={isSubmitting}
          />
          {form.formState.errors.answers?.official_company_address && (
            <p className="text-sm text-destructive pt-1">
              {form.formState.errors.answers.official_company_address.message}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
} 