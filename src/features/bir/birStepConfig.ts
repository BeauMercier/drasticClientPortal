'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
// import { FormValues } from './BirForm'; // Old import
import { FormValues } from '@/lib/validation/bir'; // New import

// Import Step Components
import OfficialInfoStep from './steps/OfficialInfoStep';
import ContactPresenceStep from './steps/ContactPresenceStep';
import CompanyDetailsStep from './steps/CompanyDetailsStep';
import SupportingInfoStep from './steps/SupportingInfoStep';
import WebsiteSpecificsStep from './steps/WebsiteSpecificsStep';
import FinalCommentsStep from './steps/FinalCommentsStep';
// FileUploadStep will be imported here when created

export interface StepProps {
  form: UseFormReturn<FormValues>;
  isSubmitting: boolean;
  // Add any other common props needed by all steps
}

export interface BirStep {
  id: string;
  name: string; // User-friendly name for display (e.g., in a stepper)
  fields: (keyof FormValues['answers'])[]; // Field names for validation trigger
  component: React.ComponentType<StepProps>;
}

export const birStepsConfig: BirStep[] = [
  {
    id: 'officialInfo',
    name: 'Official Information',
    component: OfficialInfoStep,
    fields: [
      'official_company_name',
      'official_company_phone',
      'official_company_email',
      'official_company_address',
    ],
  },
  {
    id: 'contactPresence',
    name: 'Contact & Online Presence',
    component: ContactPresenceStep,
    fields: [
      'email',
      'website_url',
      'facebook_url',
      'instagram_url',
      'other_social_links',
    ],
  },
  {
    id: 'companyDetails',
    name: 'Company Details',
    component: CompanyDetailsStep,
    fields: [
      'services_description',
      'company_history_mission',
      'team_member_profiles',
    ],
  },
  {
    id: 'supportingInfo',
    name: 'Supporting Information',
    component: SupportingInfoStep,
    fields: [
      'certifications_testimonials_case_studies',
      'partnerships_affiliations',
      'faqs_key_information',
    ],
  },
  {
    id: 'websiteSpecifics',
    name: 'Website Specifics',
    component: WebsiteSpecificsStep,
    fields: ['specific_features_requests'],
  },
  {
    id: 'finalComments',
    name: 'Final Comments',
    component: FinalCommentsStep,
    fields: ['additional_comments'],
  },
  // Example for FileUploadStep (to be added later)
  // {
  //   id: 'fileUpload',
  //   name: 'File Uploads',
  //   component: FileUploadStep, // This component will need different props
  //   fields: [], // File uploads might not use form.trigger in the same way
  // },
]; 