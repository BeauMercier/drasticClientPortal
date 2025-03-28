'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordResetForm } from '../../features/auth';
import { useAuth } from '../../features/auth';

export default function ResetPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your email to receive a password reset link</p>
      </div>
      
      <PasswordResetForm redirectUrl="/login" />
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
} 