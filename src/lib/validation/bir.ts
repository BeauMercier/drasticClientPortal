// src/lib/validation/bir.ts
import { z } from 'zod';
import { BirStatusArray } from '@/lib/types/bir';

// Use z.enum directly with 'as const' array
export const birStatusSchema = z.enum(BirStatusArray);

// Define a schema for the structure of the 'answers' JSONB field
// Updated based on user-provided field list
export const birAnswersSchema = z.object({
  official_company_name: z.string().min(1, { message: 'Official company name is required' }),
  official_company_phone: z.string().min(1, { message: 'Official phone number is required' }), // Consider adding more specific phone validation if needed
  official_company_email: z.string().email({ message: 'Invalid official email address' }),
  official_company_address: z.string().min(1, { message: 'Official street address is required' }),
  email: z.string().email({ message: 'Invalid general email address' }), // General contact email
  website_url: z.string().url({ message: 'Invalid website URL' }).optional().or(z.literal('')),
  facebook_url: z.string().url({ message: 'Invalid Facebook URL' }).optional().or(z.literal('')),
  instagram_url: z.string().url({ message: 'Invalid Instagram URL' }).optional().or(z.literal('')),
  other_social_links: z.array(z.string().url()).optional(), // Array of URLs for other links
  services_description: z.string().min(1, { message: 'Detailed description of services is required' }),
  company_history_mission: z.string().min(1, { message: 'Company history and mission statement is required' }),
  team_member_profiles: z.string().optional(), // Could be text, or maybe links/structure later
  certifications_testimonials_case_studies: z.string().optional(), // Text area for these details
  partnerships_affiliations: z.string().optional(),
  faqs_key_information: z.string().optional(),
  specific_features_requests: z.string().optional(),
  // File uploads need dedicated handling - Placeholder fields for now
  // logo_files: z.array(z.string()).optional(), // Example: Store paths or IDs
  // style_guide_files: z.array(z.string()).optional(),
  // business_photos: z.array(z.string()).optional(),
  // certification_license_files: z.array(z.string()).optional(),
  additional_comments: z.string().optional(),
});

export const birInsertSchema = z.object({
  project_id: z.string().uuid(),
  client_id: z.string().uuid(),
  project_type: z.literal('web_design'), // enforced also by RLS
  answers: birAnswersSchema, // Use the updated, structured answers schema
});

export const birUpdateSchema = z
  .object({
    id: z.string().uuid(), // Required to identify the record to update
    answers: birAnswersSchema.optional(), // Allow updating answers
    status: birStatusSchema.optional(), // Allow updating status
  })
  // Ensure at least one field (answers or status) is provided for update
  .refine((data) => data.answers !== undefined || data.status !== undefined, {
    message: 'Either answers or status must be provided to update.',
    // path: [], // No specific path needed for this refinement
  });

export type BirInsertDTO = z.infer<typeof birInsertSchema>;
export type BirUpdateDTO = z.infer<typeof birUpdateSchema>;
export type BirAnswersData = z.infer<typeof birAnswersSchema>; // Export Answers type 