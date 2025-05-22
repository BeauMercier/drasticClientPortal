/**
 * Hook for billing operations
 * 
 * Provides functionality for working with invoices and payment methods
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  // getInvoices, 
  // getInvoice, 
  // getCustomer, 
  // downloadInvoice, 
  // updatePaymentMethod 
} from '../api';
import { 
  Invoice, 
  // InvoiceListParams, 
  // Customer, 
  // PaymentMethod 
} from '../types';
import { supabase } from '@/lib/api';

// interface BillingHookState {
//   invoices: Invoice[];
//   currentInvoice: Invoice | null;
//   customer: Customer | null;
//   isLoading: boolean;
//   error: string | null;
// }

// Mock user for development
// const mockUser = {
//   id: 'user_123456',
//   email: 'user@example.com'
// };

interface UseBillingReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: (options?: { limit?: number }) => Promise<void>;
  downloadInvoicePdf: (invoice: Invoice) => Promise<string | null>;
}

export function useBilling(): UseBillingReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async (options?: { limit?: number }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Build query
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      // Execute query
      const { data, error: queryError } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      // Transform and sort by date descending
      const processedInvoices = data || [];
      setInvoices(processedInvoices);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download invoice PDF
  const downloadInvoicePdf = useCallback(async (invoice: Invoice): Promise<string | null> => {
    if (!invoice.pdf_url) {
      setError('PDF URL not available for this invoice');
      return null;
    }
    
    try {
      // If it's already a full URL, just return it
      if (invoice.pdf_url.startsWith('http')) {
        return invoice.pdf_url;
      }
      
      // Otherwise, get a download URL from Supabase Storage
      // Direct cast to any to bypass TypeScript checks for this operation
      const { data } = await (supabase.storage.from('invoices') as any).getPublicUrl(invoice.pdf_url);
      
      if (!data || !data.publicUrl) {
        throw new Error('Failed to get public URL for invoice PDF');
      }
      
      return data.publicUrl;
    } catch (err: any) {
      console.error('Error downloading invoice PDF:', err);
      setError(err.message || 'Failed to download invoice PDF');
      return null;
    }
  }, []);

  // Load invoices on mount
  useEffect(() => {
    fetchInvoices({ limit: 10 });
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    downloadInvoicePdf
  };
} 