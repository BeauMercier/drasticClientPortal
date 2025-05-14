'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from '@/lib/validation/bir'; // New import

interface ContactPresenceStepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
}

/**
 * Renders the contact and online presence step in the BIR multi-step form.
 *
 * @param {ContactPresenceStepProps} props The component props.
 * @param {UseFormReturn<FormValues>} props.form The react-hook-form instance.
 * @param {boolean} props.isSubmitting Indicates if the form is currently submitting.
 * @returns {JSX.Element} The contact and online presence step component.
 */
export default function ContactPresenceStep({ form, isSubmitting }: ContactPresenceStepProps) {
  return (
    <fieldset className="space-y-4 border p-4 rounded-md">
      {/* <legend className="text-lg font-semibold px-2">Contact & Online Presence</legend> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* General Email */}
        <div className="space-y-1">
          <Label htmlFor="email">General Contact Email *</Label>
          <Input 
            id="email" 
            type="email" 
            {...form.register('answers.email')} 
            disabled={isSubmitting} 
          />
          {form.formState.errors.answers?.email && 
            <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.email.message}</p>}
        </div>
        {/* Website URL */}
        <div className="space-y-1">
          <Label htmlFor="website_url">Website URL</Label>
          <Input 
            id="website_url" 
            type="url" 
            {...form.register('answers.website_url')} 
            placeholder="https://..." 
            disabled={isSubmitting} 
          />
          {form.formState.errors.answers?.website_url && 
            <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.website_url.message}</p>}
        </div>
        {/* Facebook URL */}
        <div className="space-y-1">
          <Label htmlFor="facebook_url">Facebook URL</Label>
          <Input 
            id="facebook_url" 
            type="url" 
            {...form.register('answers.facebook_url')} 
            placeholder="https://facebook.com/..." 
            disabled={isSubmitting} 
          />
          {form.formState.errors.answers?.facebook_url && 
            <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.facebook_url.message}</p>}
        </div>
        {/* Instagram URL */}
        <div className="space-y-1">
          <Label htmlFor="instagram_url">Instagram URL</Label>
          <Input 
            id="instagram_url" 
            type="url" 
            {...form.register('answers.instagram_url')} 
            placeholder="https://instagram.com/..." 
            disabled={isSubmitting} 
          />
          {form.formState.errors.answers?.instagram_url && 
            <p className="text-sm text-destructive pt-1">{form.formState.errors.answers.instagram_url.message}</p>}
        </div>
      </div>
      {/* Other Social Links */}
      <div className="space-y-1">
        <Label htmlFor="other_social_links">Other Social Links (Enter full URLs, one per line)</Label>
        <Textarea
          id="other_social_links"
          {...form.register('answers.other_social_links', {
            setValueAs: (v) => typeof v === 'string' ? v.split('\n').map(s => s.trim()).filter(Boolean) : [],
          })}
          rows={3}
          placeholder="https://linkedin.com/company/...\nhttps://twitter.com/..."
          disabled={isSubmitting}
        />
        {form.formState.errors.answers?.other_social_links && 
          <p className="text-sm text-destructive pt-1">Please enter valid URLs, one per line.</p>} 
      </div>
    </fieldset>
  );
} 