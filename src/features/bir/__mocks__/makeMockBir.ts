import { BirRow, BirStatus } from '@/lib/types/bir';

// Helper to create a mock BIR object
export const makeMockBir = (override?: Partial<BirRow> & { status?: BirStatus }): BirRow | null => {
  if (!override?.status) return null;
  return {
    id: 'bir123',
    project_id: 'proj123',
    client_id: 'client123',
    project_type: 'web_design',
    answers: { official_company_name: 'Test Co' },
    status: 'pending', // Default, will be overridden
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    submitted_at: null,
    ...override,
  } as BirRow;
}; 