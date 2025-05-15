'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { Card } from '@/shared/ui/molecules';
import { Button } from '@/shared/ui/atoms';
import { ComingSoon } from '@/components/ui/coming-soon';

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice_url: string;
}

export default function BillingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  
  // Sample plans data
  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      description: 'Essential features for small projects',
      features: [
        '5 GB Storage',
        'Up to 3 Team Members',
        'Basic Support',
        '1 Active Project'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 19.99,
      description: 'Enhanced features for growing teams',
      features: [
        '25 GB Storage',
        'Up to 10 Team Members',
        'Priority Support',
        'Unlimited Projects',
        'Custom Domains'
      ],
      isPopular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      description: 'Advanced features for large organizations',
      features: [
        'Unlimited Storage',
        'Unlimited Team Members',
        '24/7 Premium Support',
        'Advanced Security',
        'Custom Integrations',
        'Dedicated Account Manager'
      ]
    }
  ];
  
  // Sample invoices
  const invoices: Invoice[] = [
    {
      id: 'INV-2023-001',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 19.99,
      status: 'paid',
      invoice_url: '#'
    },
    {
      id: 'INV-2023-002',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 19.99,
      status: 'paid',
      invoice_url: '#'
    },
    {
      id: 'INV-2023-003',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 19.99,
      status: 'paid',
      invoice_url: '#'
    }
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handlePlanChange = (planId: string) => {
    // In a real app, this would trigger a subscription change API call
    setCurrentPlan(planId);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-black relative">
      {/* Render ComingSoon overlay covering the entire page content if not active */}
      {true && (
        <ComingSoon className="absolute inset-0" />
      )}

      {/* Actual Billing Page Content - will be visually under the overlay if ComingSoon is active */}
      {/* Current Plan */}
      <Card className="bg-white dark:bg-black shadow-lg mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Current Plan</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                You are currently on the <span className="font-medium">{plans.find(p => p.id === currentPlan)?.name}</span> plan.
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Manage Payment Methods
            </Button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Next billing date</div>
              <div className="font-medium text-gray-900 dark:text-white">May 12, 2023</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payment method</div>
              <div className="font-medium text-gray-900 dark:text-white">Visa ending in 4242</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Plans */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`bg-white dark:bg-black shadow-lg ${plan.isPopular ? 'ring-2 ring-red-500' : ''} relative`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
            )}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price.toFixed(2)}</span>
                <span className="ml-1 text-gray-600 dark:text-gray-400 text-sm">/month</span>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
              
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6">
                {plan.id === currentPlan ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button variant="primary" className="w-full" onClick={() => handlePlanChange(plan.id)}>
                    Switch Plan
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment History</h2>
      <Card className="bg-white dark:bg-black shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoice
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={invoice.invoice_url} className="text-blue-600 dark:text-blue-400 hover:underline">
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}; 