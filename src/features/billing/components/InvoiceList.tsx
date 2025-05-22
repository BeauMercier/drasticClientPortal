'use client';

// Using JSX without React import is valid in React 17+ with the new JSX transform
// If using TypeScript, the types are still needed
import React from 'react';
import { useEffect } from 'react';
import { useBilling } from '../hooks/useBilling';
import { Invoice } from '../types';
import { Card } from '../../../shared/ui';

export interface InvoiceListProps {
  invoices: Invoice[];
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  const { isLoading, error, fetchInvoices } = useBilling();

  useEffect(() => {
    fetchInvoices({ limit: invoices.length });
  }, [fetchInvoices, invoices.length]);

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && invoices.length === 0) {
    return (
      <div className="bg-danger-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Error loading invoices</h3>
            <div className="mt-2 text-sm text-danger-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-secondary-900">No invoices found</h3>
          <p className="mt-1 text-sm text-secondary-500">
            You don't have any invoices yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding>
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div 
            key={invoice.id} 
            className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">#{invoice.invoice_number || invoice.id.slice(0, 8)}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">
                {formatDate(invoice.due_date || invoice.created_at)}
              </span>
              <span className="font-medium">
                {formatCurrency(invoice.amount, invoice.currency)}
              </span>
            </div>
            
            {invoice.pdf_url && (
              <div className="mt-2 text-right">
                <a 
                  href={invoice.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View PDF
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const formatCurrency = (amount: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount);
};

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'open':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}; 