import { describe, it, expect } from 'vitest';
import { birUpdateSchema, birAnswersSchema } from './bir'; // Adjusted import path

describe('BIR Validation Schemas', () => {
  describe('birUpdateSchema', () => {
    it('allows update with empty-string fields once pruned', () => {
      const payloadWithEmptyString = {
        id: crypto.randomUUID(),
        answers: { official_company_name: '' }, // User cleared a required field
        status: 'pending' as const,
      };

      // Simulate the pruning that MultiStepBirForm.tsx now does for the update path
      const prunedAnswers = Object.fromEntries(
        Object.entries(payloadWithEmptyString.answers).filter(([, value]) => value !== '')
      );

      const prunedPayload = { 
        ...payloadWithEmptyString, 
        answers: prunedAnswers 
      };

      const result = birUpdateSchema.safeParse(prunedPayload);
      expect(result.success, `Validation failed: ${JSON.stringify(result.success ? {} : result.error.flatten())}`).toBe(true);
    });

    it('allows partial updates to answers', () => {
      const payload = {
        id: crypto.randomUUID(),
        answers: { official_company_phone: '1234567890' }, // Only one field provided
        status: 'pending' as const,
      };
      const result = birUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('requires id for update', () => {
      const payload = {
        // id: crypto.randomUUID(), // ID is missing
        answers: { official_company_name: 'Test Co' },
        status: 'pending' as const,
      };
      const result = birUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.success ? {} : result.error.issues[0].path).toContain('id');
    });

    it('fails if neither answers nor status is provided', () => {
      const payload = {
        id: crypto.randomUUID(),
        // answers: {}, // Missing
        // status: 'pending', // Missing
      };
      const result = birUpdateSchema.safeParse(payload);
      expect(result.success).toBe(false);
      // The .refine error doesn't have a specific path by default in the message, 
      // so we check for the custom message if needed or just success status.
      expect(result.success ? {} : result.error.message).toContain('Either answers or status must be provided to update');
    });

    it('passes if only status is provided', () => {
      const payload = {
        id: crypto.randomUUID(),
        status: 'submitted' as const,
      };
      const result = birUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('passes if only answers (even empty but pruned) are provided', () => {
      const payload = {
        id: crypto.randomUUID(),
        answers: {}, // Empty answers after pruning
      };
      const result = birUpdateSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

  });

  describe('birAnswersSchema', () => {
    it('requires official_company_name', () => {
      const result = birAnswersSchema.partial().safeParse({ official_company_phone: '123' });
      // .partial() means official_company_name is not required to be present
      expect(result.success).toBe(true); 

      const resultWithEmpty = birAnswersSchema.safeParse({ official_company_name: '' });
      expect(resultWithEmpty.success).toBe(false);
      expect(resultWithEmpty.success ? {} : resultWithEmpty.error.flatten().fieldErrors.official_company_name).toContain('Official company name is required');
    });

    it('validates email format for official_company_email', () => {
      const result = birAnswersSchema.safeParse({ official_company_email: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.success ? {} : result.error.flatten().fieldErrors.official_company_email).toContain('Invalid official email address');
    });

     it('allows optional fields to be truly absent when using .partial()', () => {
      const data = {
        official_company_name: 'Test Co',
        official_company_phone: '1234567890',
        official_company_email: 'test@example.com',
        official_company_address: '123 Main St',
        email: 'contact@example.com',
        services_description: 'Services',
        company_history_mission: 'History',
        // team_member_profiles is optional and absent
      };
      const result = birAnswersSchema.partial().safeParse(data);
      expect(result.success).toBe(true);
    });

    it('allows optional fields to be present with valid data when using .partial()', () => {
      const data = {
        official_company_name: 'Test Co',
        official_company_phone: '1234567890',
        official_company_email: 'test@example.com',
        official_company_address: '123 Main St',
        email: 'contact@example.com',
        services_description: 'Services',
        company_history_mission: 'History',
        team_member_profiles: 'Our Team' // Optional field present
      };
      const result = birAnswersSchema.partial().safeParse(data);
      expect(result.success).toBe(true);
    });
  });
}); 