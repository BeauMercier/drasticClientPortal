/**
 * Billing Types
 * 
 * This file contains all billing and invoice-related type definitions.
 */

import { BaseEntity } from './common';
import { Tables } from './dbHelpers';

/**
 * Invoice type from database schema
 */
export type Invoice = Tables<'billing_invoices'>;

/**
 * Invoice status values
 */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

/**
 * Payment method types
 */
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'other';

/**
 * Currency types
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

/**
 * Invoice creation parameters
 */
export interface CreateInvoiceParams {
  amount: number;
  currency?: Currency;
  description?: string;
  due_date: string;
  invoice_number?: string;
  user_id: string;
  status?: InvoiceStatus;
}

/**
 * Invoice update parameters
 */
export interface UpdateInvoiceParams {
  amount?: number;
  currency?: Currency;
  description?: string;
  due_date?: string;
  status?: InvoiceStatus;
  paid_at?: string | null;
  payment_method?: PaymentMethod;
}

/**
 * Invoice list parameters
 */
export interface InvoiceListParams {
  user_id?: string;
  status?: InvoiceStatus;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Subscription plan types
 */
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

/**
 * Subscription status values
 */
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Operation result for billing-related operations
 */
export interface BillingResult {
  success: boolean;
  data?: Invoice | Subscription;
  error?: string;
}

// User file (typically for receipts, etc.)
export interface UserFile extends BaseEntity {
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  project_type?: string | null;
  project_id?: string | null;
  uploaded_at: string;
} 