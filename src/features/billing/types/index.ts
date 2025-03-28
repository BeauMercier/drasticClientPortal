/**
 * Billing Types
 * 
 * Contains all type definitions related to billing, invoices, and payment.
 */

/**
 * Billing plan information
 */
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

/**
 * Customer information
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  billing_address?: BillingAddress;
  payment_methods?: PaymentMethod[];
  subscriptions?: Subscription[];
}

/**
 * Billing address information
 */
export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Payment method information
 */
export interface PaymentMethod {
  id: string;
  type: string;
  card_brand?: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
}

/**
 * Subscription information
 */
export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

/**
 * Invoice information
 */
export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  status: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  pdf_url?: string;
  invoice_items?: InvoiceItem[];
}

/**
 * Invoice item
 */
export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  period_start?: string;
  period_end?: string;
}

/**
 * Invoice list parameters
 */
export interface InvoiceListParams {
  limit?: number;
  customerId?: string;
  status?: Invoice['status'];
  startDate?: string;
  endDate?: string;
}

/**
 * Result of billing operations
 */
export interface BillingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 