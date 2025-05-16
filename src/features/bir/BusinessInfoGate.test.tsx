import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessInfoGate from './BusinessInfoGate'; // Assuming path is correct
import { useAuth } from '@/features/auth';
import { useBir } from './useBir';
import { BirRow, BirStatus } from '@/lib/types/bir'; // Assuming BirRow exists
import { KeyedMutator } from 'swr';

// Mock the hooks
vi.mock('@/features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./useBir', () => ({
  useBir: vi.fn(),
}));

// Helper to create a mock BIR object
const makeMockBir = (status?: BirStatus): BirRow | null => {
  if (!status) return null;
  return {
    id: 'bir123',
    project_id: 'proj123',
    client_id: 'client123',
    project_type: 'web_design',
    answers: { official_company_name: 'Test Co' }, // Minimal answers
    status: status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

describe('BusinessInfoGate', () => {
  const mockMutate = vi.fn() as KeyedMutator<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    (useAuth as vi.Mock).mockReturnValue({
      user: { role: 'client' },
      isLoading: false,
    });
    (useBir as vi.Mock).mockReturnValue({
      bir: null,
      signedBirFiles: [],
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });
  });

  // Test matrix
  it.each([
    [undefined, /multi-step business information form/i], // Expect form for new/undefined BIR
    ['pending', /you have a saved draft/i],
    ['submitted', /business information submitted!/i],
    ['approved', /business information approved!/i],
  ])('shows correct panel for BIR status: %s', async (status, expectedText) => {
    const mockBirData = makeMockBir(status as BirStatus | undefined);
    (useBir as vi.Mock).mockReturnValueOnce({
      bir: mockBirData,
      signedBirFiles: [],
      isLoading: false,
      error: null,
      mutate: mockMutate,
    });

    await act(async () => {
      render(<BusinessInfoGate projectId="proj123" projectType="web_design" parentMutateBir={mockMutate} />);
    });
    
    // Using findByText to handle potential async updates from useEffect
    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it('shows loading skeletons when auth is loading', async () => {
    (useAuth as vi.Mock).mockReturnValueOnce({ user: null, isLoading: true });
    render(<BusinessInfoGate projectId="proj123" projectType="web_design" />);
    // Check for a known accessible name or role of a skeleton part if possible
    // For now, checking for presence of multiple skeleton elements (less specific)
    expect(screen.getAllByRole('status', { name: /loading/i }).length).toBeGreaterThan(0); 
    // Note: ShadCN skeletons might not have explicit role="status" or accessible name by default.
    // A more robust way would be to add data-testid to skeletons or check for their specific structure/class.
    // For this example, if skeletons are just divs, a more complex query or data-testid is needed.
  });

  it('shows loading skeletons when BIR data is loading', async () => {
    (useBir as vi.Mock).mockReturnValueOnce({ bir: null, signedBirFiles: [], isLoading: true, error: null, mutate: mockMutate });
    render(<BusinessInfoGate projectId="proj123" projectType="web_design" />);
    expect(screen.getAllByRole('status', { name: /loading/i }).length).toBeGreaterThan(0);
  });

  it('shows error message if BIR fetching fails', async () => {
    (useBir as vi.Mock).mockReturnValueOnce({
      bir: null,
      signedBirFiles: [],
      isLoading: false,
      error: { message: 'Failed to load' },
      mutate: mockMutate,
    });
    render(<BusinessInfoGate projectId="proj123" projectType="web_design" />);
    expect(await screen.findByText(/error loading business information: failed to load/i)).toBeInTheDocument();
  });

  it('renders nothing if projectType is not web_design', async () => {
    const { container } = render(<BusinessInfoGate projectId="proj123" projectType="logo_design" />);
    expect(container.firstChild).toBeNull(); // Or check for a specific "not applicable" message if you add one
  });

  // TODO: Add tests for button clicks leading to MultiStepBirForm or BirSummary display
  // Example: Clicking "Edit/Continue Draft" on pending BIR panel
}); 