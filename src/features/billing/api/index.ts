/**
 * Billing API Module
 * 
 * Contains all API functions related to billing, invoices, and payment.
 */

import {
  Invoice,
  InvoiceListParams,
  Customer,
  PaymentMethod,
  BillingResult,
  InvoiceItem,
  Subscription
} from '../types';

// Import Supabase client from the correct location
import { supabase } from '@/lib/api';
import { Database } from '@/lib/database.types';

// Helper types based on database.types.ts and observed usage
type BillingInvoiceSupabaseRow = Database['public']['Tables']['billing_invoices']['Row'];

// Represents the structure of individual items within the 'invoice_items' array
// from Supabase, matching properties accessed in the original mapping.
interface SupabaseInvoiceItem {
  id: string;
  description: string | null;
  amount: number;
  quantity: number;
  period_start: string | null;
  period_end: string | null;
  // Add other properties if they exist on the joined invoice_items
}

// Represents a row from 'billing_invoices' enriched with joined 'invoice_items'
// and any other fields implied by original code (like pdf_url).
type EnrichedBillingInvoiceFromSupabase = BillingInvoiceSupabaseRow & {
  invoice_items: SupabaseInvoiceItem[];
  pdf_url?: string | null; // Original code used item.pdf_url. Not in BillingInvoiceSupabaseRow.
};

// Helper type for the raw row from a 'customers' table/view (assuming it exists and is like profiles)
// and including joined payment_methods and subscriptions which might be any[] from Supabase perspective initially.
// The billing_address is assumed to be a JSON object or null in the database.
type SupabaseCustomerViewRow = Omit<Database['public']['Tables']['profiles']['Row'], 'address' | 'city' | 'state' | 'zip' | 'country'> & {
  // Assuming these fields come directly from the 'customers' source if it's different from 'profiles' table
  name?: string | null; // profiles.full_name might be the source
  email?: string | null; // profiles.email is the source
  // Explicitly define billing_address structure if it's a JSONB column
  billing_address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
  payment_methods?: any[] | null; // Actual type from DB for joined data is unknown here
  subscriptions?: any[] | null;   // Actual type from DB for joined data is unknown here
};

// Helper types for items within joined arrays, based on current mapping logic
interface SupabasePaymentMethod {
  id: string;
  type: string | null;
  card_brand?: string | null;
  last_four?: string | null;
  expiry_month?: number | null;
  expiry_year?: number | null;
  is_default?: boolean | null;
}

interface SupabaseSubscription {
  id: string;
  customer_id: string | null; // Assuming this refers to the main customer/user ID
  plan_id: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string | null;
}

/**
 * Get a list of invoices for the current user
 */
export async function getInvoices(params?: InvoiceListParams): Promise<BillingResult<Invoice[]>> {
  try {
    const { limit = 10, customerId, status: _status, startDate: _startDate, endDate: _endDate } = params || {};
    
    // Get the user's invoices from Supabase
    const { data, error } = await supabase
      .from('billing_invoices')
      .select('*, invoice_items(*)')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // If data is null (e.g. RLS or no records), return empty success.
    if (!data) {
        return {
            success: true,
            data: []
        };
    }
    
    // Transform the data to match our types
    // Cast `data` to our expected enriched type
    const supabaseData = data as EnrichedBillingInvoiceFromSupabase[];

    const invoices: Invoice[] = supabaseData.map((item): Invoice => ({
      id: item.id,
      customer_id: item.user_id!, // Assuming user_id from DB is non-null and maps to customer_id
      invoice_number: item.invoice_number ?? undefined,
      amount: item.amount,
      currency: item.currency ?? 'usd', // Defaulting null currency to 'usd', review if appropriate
      status: item.status ?? 'draft', // Defaulting null status to 'draft', review if appropriate
      due_date: item.due_date, // DB is string, App is string | undefined - compatible
      paid_at: item.paid_at ?? undefined,
      created_at: item.created_at ?? new Date(0).toISOString(), // Defaulting null created_at to epoch, review!
      pdf_url: item.pdf_url ?? undefined, 
      invoice_items: item.invoice_items.map((lineItem: SupabaseInvoiceItem): InvoiceItem => ({
        id: lineItem.id,
        description: lineItem.description ?? '',
        amount: lineItem.amount,
        quantity: lineItem.quantity,
        period_start: lineItem.period_start ?? undefined,
        period_end: lineItem.period_end ?? undefined
      }))
    }));
    
    return {
      success: true,
      data: invoices
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve invoices'
    };
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<BillingResult<Invoice>> {
  try {
    // Get the invoice from Supabase
    const { data, error } = await supabase
      .from('billing_invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoiceId)
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // If data is null (e.g. RLS, not found, or other issue), return an error.
    if (!data) {
        return {
            success: false,
            error: 'Invoice not found or access denied.'
        };
    }
    
    // Cast `data` to our expected enriched type
    const supabaseInvoice = data as EnrichedBillingInvoiceFromSupabase;

    // Transform the data to match our types
    const invoice: Invoice = {
      id: supabaseInvoice.id,
      customer_id: supabaseInvoice.user_id!, // Assuming user_id maps to customer_id and is non-null
      invoice_number: supabaseInvoice.invoice_number ?? undefined,
      amount: supabaseInvoice.amount,
      currency: supabaseInvoice.currency ?? 'usd', // Defaulting null, review
      status: supabaseInvoice.status ?? 'draft', // Defaulting null, review
      due_date: supabaseInvoice.due_date, // DB is string, App is string | undefined
      paid_at: supabaseInvoice.paid_at ?? undefined,
      created_at: supabaseInvoice.created_at ?? new Date(0).toISOString(), // Defaulting null, review
      pdf_url: supabaseInvoice.pdf_url ?? undefined,
      invoice_items: supabaseInvoice.invoice_items.map((lineItem: SupabaseInvoiceItem): InvoiceItem => ({
        id: lineItem.id,
        description: lineItem.description ?? '',
        amount: lineItem.amount,
        quantity: lineItem.quantity,
        period_start: lineItem.period_start ?? undefined,
        period_end: lineItem.period_end ?? undefined
      }))
    };
    
    return {
      success: true,
      data: invoice
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve invoice'
    };
  }
}

/**
 * Get customer billing information
 */
export async function getCustomer(customerId: string): Promise<BillingResult<Customer>> {
  try {
    // Get the customer from Supabase
    // IMPORTANT: Assuming 'customers' is a valid table or view name.
    // If not, this needs to be changed (e.g., to 'profiles').
    const { data, error } = await supabase
      .from('customers') 
      .select('*, payment_methods(*), subscriptions(*)')
      .eq('id', customerId)
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Customer not found or access denied.'
      };
    }
    
    const dbCustomer = data as SupabaseCustomerViewRow;

    // Find the default payment method more safely
    const defaultPmData = dbCustomer.payment_methods?.find((pm: any): pm is SupabasePaymentMethod => pm && pm.is_default === true);

    // Transform the data to match our types
    const customer: Customer = {
      id: dbCustomer.id, // id is non-null in profiles table, assuming same for customers view/table
      name: dbCustomer.name ?? dbCustomer.full_name ?? 'N/A', // Use name or full_name
      email: dbCustomer.email ?? 'N/A',
      billing_address: dbCustomer.billing_address ? {
        line1: dbCustomer.billing_address.line1 ?? undefined,
        line2: dbCustomer.billing_address.line2 ?? undefined,
        city: dbCustomer.billing_address.city ?? undefined,
        state: dbCustomer.billing_address.state ?? undefined,
        postal_code: dbCustomer.billing_address.postal_code ?? undefined,
        country: dbCustomer.billing_address.country ?? undefined,
      } : undefined,
      payment_methods: defaultPmData ? [
        {
          id: defaultPmData.id,
          type: defaultPmData.type ?? 'unknown',
          card_brand: defaultPmData.card_brand ?? undefined,
          last_four: defaultPmData.last_four ?? undefined,
          expiry_month: defaultPmData.expiry_month ?? undefined,
          expiry_year: defaultPmData.expiry_year ?? undefined,
          is_default: true
        }
      ] : undefined,
      subscriptions: (dbCustomer.subscriptions as SupabaseSubscription[] | null)?.map((sub): Subscription => ({
        id: sub.id,
        customer_id: sub.customer_id ?? dbCustomer.id, // Fallback to main customer id if null
        plan_id: sub.plan_id ?? 'unknown_plan',
        status: sub.status ?? 'unknown',
        current_period_start: sub.current_period_start ?? new Date(0).toISOString(),
        current_period_end: sub.current_period_end ?? new Date(0).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        created_at: sub.created_at ?? new Date(0).toISOString(),
      })) ?? undefined, // If subscriptions array is null/undefined, result is undefined
    };
    
    return {
      success: true,
      data: customer
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve customer information'
    };
  }
}

/**
 * Download an invoice PDF
 */
export async function downloadInvoice(invoiceId: string): Promise<BillingResult<string>> {
  try {
    // Get the invoice from Supabase
    const { data, error } = await supabase
      .from('invoices')
      .select('pdf_url')
      .eq('id', invoiceId)
      .limit(1)
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    if (!data.pdf_url) {
      return {
        success: false,
        error: 'No PDF available for this invoice'
      };
    }
    
    return {
      success: true,
      data: data.pdf_url
    };
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download invoice'
    };
  }
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(
  customerId: string,
  paymentMethodData: Partial<PaymentMethod>
): Promise<BillingResult<PaymentMethod>> {
  try {
    // This would typically call a serverless function or API endpoint
    // that interfaces with your payment processor (Stripe, etc.)
    // For now, we'll just mock a successful response
    
    // Mock the response for demo purposes
    // In a real app, this would likely call an API endpoint
    // that updates the payment method in the payment processor
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const paymentMethod: PaymentMethod = {
      id: paymentMethodData.id || 'pm_mock_id',
      type: paymentMethodData.type || 'card',
      card_brand: paymentMethodData.card_brand || 'visa',
      last_four: paymentMethodData.last_four || '4242',
      expiry_month: paymentMethodData.expiry_month || 12,
      expiry_year: paymentMethodData.expiry_year || 2025,
      is_default: paymentMethodData.is_default || true
    };
    
    return {
      success: true,
      data: paymentMethod,
      message: 'Payment method updated successfully'
    };
  } catch (error) {
    console.error('Error updating payment method:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment method'
    };
  }
} 