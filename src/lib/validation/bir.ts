// src/lib/validation/bir.ts
import { z } from 'zod';
import { BirStatusArray } from '@/lib/types/bir';

// Use z.enum directly with 'as const' array
export const birStatusSchema = z.enum(BirStatusArray);

// Define a schema for the structure of the 'answers' JSONB field
// TODO: Finalize these fields based on actual BIR form requirements
export const birAnswersSchema = z.object({
  business_name: z.string().min(1, { message: 'Business name is required' }),
  industry: z.string().min(1, { message: 'Industry is required' }),
  colours: z.array(z.string()).optional(),
  // Add other expected fields here...
});

export const birInsertSchema = z.object({
  project_id: z.string().uuid(),
  client_id: z.string().uuid(),
  project_type: z.literal('web_design'), // enforced also by RLS
  answers: birAnswersSchema, // Use the structured answers schema
});

export const birUpdateSchema = z
  .object({
    id: z.string().uuid(), // Required to identify the record to update
    answers: birAnswersSchema.optional(), // Use the structured answers schema
    status: birStatusSchema.optional(),
  })
  // Ensure at least one field (answers or status) is provided for update
  .refine((data) => data.answers !== undefined || data.status !== undefined, {
    message: 'Either answers or status must be provided to update.',
    // path: [], // You might set a specific path if needed, e.g., ['id']
  });

export type BirInsertDTO = z.infer<typeof birInsertSchema>;
export type BirUpdateDTO = z.infer<typeof birUpdateSchema>; 