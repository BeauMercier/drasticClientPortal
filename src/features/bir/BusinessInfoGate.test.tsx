/// <reference types="vitest/globals" />

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils'; // <-- Adjusted path
import BusinessInfoGate from './BusinessInfoGate';
import { useAuth } from '@/features/auth'; // <-- Import useAuth
import { useBir } from './useBir';
import { makeMockBir } from './__mocks__/makeMockBir';
import { KeyedMutator } from 'swr'; // For mockMutate type

// --- mocks -----------------------------------------------------------------
vi.mock('./useBir');
vi.mock('@/features/auth', () => ({
  useAuth: vi.fn(() => ({
    user: { role: 'client' },
    isLoading: false,
  })),
}));

// helper to DRY the repetitive mock wiring
function mockBirHook(override: Partial<ReturnType<typeof useBir>>) {
  (useBir as unknown as vi.Mock).mockReturnValue({
    bir: null,
    isLoading: false,
    error: null, // Keep using 'error' object, not 'isError' boolean
    mutate: vi.fn() as KeyedMutator<any>, // Added KeyedMutator type
    signedBirFiles: [], // Add missing signedBirFiles from original mock
    ...override,
  });
}

describe('BusinessInfoGate', () => {
  beforeEach(() => {
    // vi.clearAllMocks(); // <-- REMOVE THIS as it's in afterEach
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --------------------- 0. DEFAULT (NEW BIR) ---------------------------
  it('shows multi-step form for new/undefined BIR', async () => {
    mockBirHook({ bir: null }); // Explicitly null for new BIR
    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);
    await waitFor(() =>
      expect(
        screen.getByText(/multi-step business information form/i),
      ).toBeInTheDocument(),
    );
  });

  // --------------------- 1. PENDING ---------------------------------------
  it('shows correct panel for BIR status: pending', async () => {
    mockBirHook({
      bir: makeMockBir({ status: 'pending' }),
    });

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    await waitFor(() =>
      expect(
        screen.getByText(/you have a saved draft/i),
      ).toBeInTheDocument(),
    );
  });

  // --------------------- 2. SUBMITTED -------------------------------------
  it('shows correct panel for BIR status: submitted', async () => {
    mockBirHook({
      bir: makeMockBir({ status: 'submitted', submitted_at: new Date().toISOString() }), // ensure submitted_at is a string for submitted status
    });

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    await waitFor(() =>
      expect(
        screen.getByText(/business information submitted!/i),
      ).toBeInTheDocument(),
    );
  });

  // --------------------- 3. APPROVED --------------------------------------
  it('shows correct panel for BIR status: approved', async () => {
    mockBirHook({
      bir: makeMockBir({ status: 'approved', submitted_at: new Date().toISOString() }), // ensure submitted_at is a string for approved status
    });

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    await waitFor(() =>
      expect(
        screen.getByText(/business information approved!/i),
      ).toBeInTheDocument(),
    );
  });

  // --------------------- 4. AUTH LOADING ----------------------------------
  it('shows loading skeletons when auth is loading', async () => {
    // Mock useAuth directly for this specific test case
    vi.mocked(useAuth).mockReturnValueOnce({ user: null, isLoading: true } as any); // Simplified, cast to any to bypass strict type checking for the mock if necessary for now
    mockBirHook({}); // Default BIR state

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    const skeletons = await screen.findAllByTestId('loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // --------------------- 5. BIR LOADING -----------------------------------
  it('shows loading skeletons when BIR data is loading', async () => {
    mockBirHook({ isLoading: true });

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    const skeletons = await screen.findAllByTestId('loading-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // --------------------- 6. ERROR PATH ------------------------------------
  it('shows error message if BIR fetching fails', async () => {
    mockBirHook({ error: new Error('Failed to load') }); // Use 'error' here

    renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="web_design" />);

    await waitFor(() =>
      expect(
        screen.getByText(
          /error loading business information: failed to load/i,
        ),
      ).toBeInTheDocument(),
    );
  });

  // --------------------- 7. NOT APPLICABLE PROJECT TYPE -------------------
  it('renders nothing if projectType is not web_design', async () => {
    mockBirHook({}); // Default BIR state
    const { container } = renderWithProviders(<BusinessInfoGate projectId="proj123" projectType="logo_design" />); // Different project type
    expect(container.firstChild).toBeNull();
  });
}); 