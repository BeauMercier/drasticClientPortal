'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';

export default function BillingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/'); // Or your login page if different
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

  // Don't render if not authenticated (should be caught by useEffect, but good practice)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-144px)] text-center">
      {/* Adjust min-h if header/footer height is different */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Billing Page Not Available
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        This page is currently unavailable. Please contact support if you have any questions.
      </p>
    </div>
  );
} 