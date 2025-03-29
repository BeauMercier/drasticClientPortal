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
  BillingResult
} from '../types';

// Import Supabase client from the correct location
import { supabase } from '@/lib/api';

/**
 * Get a list of invoices for the current user
 */
export async function getInvoices(params?: InvoiceListParams): Promise<BillingResult<Invoice[]>> {
  try {
    const { limit = 10, customerId, status, startDate, endDate } = params || {};
    
    // Get the user's invoices from Supabase
    const { data, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // Transform the data to match our types
    const invoices = data.map((item: any) => ({
      id: item.id,
      customer_id: item.customer_id,
      invoice_number: item.invoice_number,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      due_date: item.due_date,
      paid_at: item.paid_at,
      created_at: item.created_at,
      pdf_url: item.pdf_url,
      invoice_items: item.invoice_items.map((lineItem: any) => ({
        id: lineItem.id,
        description: lineItem.description,
        amount: lineItem.amount,
        quantity: lineItem.quantity,
        period_start: lineItem.period_start,
        period_end: lineItem.period_end
      }))
    })) as Invoice[];
    
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
      .from('invoices')
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
    
    // Transform the data to match our types
    const invoice: Invoice = {
      id: data.id,
      customer_id: data.customer_id,
      invoice_number: data.invoice_number,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      due_date: data.due_date,
      paid_at: data.paid_at,
      created_at: data.created_at,
      pdf_url: data.pdf_url,
      invoice_items: data.invoice_items.map((lineItem: any) => ({
        id: lineItem.id,
        description: lineItem.description,
        amount: lineItem.amount,
        quantity: lineItem.quantity,
        period_start: lineItem.period_start,
        period_end: lineItem.period_end
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
    
    // Transform the data to match our types
    const customer: Customer = {
      id: data.id,
      name: data.name,
      email: data.email,
      billing_address: data.billing_address ? {
        line1: data.billing_address.line1,
        line2: data.billing_address.line2,
        city: data.billing_address.city,
        state: data.billing_address.state,
        postal_code: data.billing_address.postal_code,
        country: data.billing_address.country
      } : undefined,
      payment_methods: data.payment_methods?.find((pm: any) => pm.is_default) ? [
        {
          id: data.payment_methods.find((pm: any) => pm.is_default).id,
          type: data.payment_methods.find((pm: any) => pm.is_default).type,
          card_brand: data.payment_methods.find((pm: any) => pm.is_default).card_brand,
          last_four: data.payment_methods.find((pm: any) => pm.is_default).last_four,
          expiry_month: data.payment_methods.find((pm: any) => pm.is_default).expiry_month,
          expiry_year: data.payment_methods.find((pm: any) => pm.is_default).expiry_year,
          is_default: true
        }
      ] : undefined,
      subscriptions: data.subscriptions.map((sub: any) => ({
        id: sub.id,
        customer_id: sub.customer_id,
        plan_id: sub.plan_id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        created_at: sub.created_at
      }))
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