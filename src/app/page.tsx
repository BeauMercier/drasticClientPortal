'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../features/auth';
import { Button } from '../shared/ui';
import DebugEnv from './debug-env';

export default function Home() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Don't show landing page if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-black">
      {/* Debug Environment Variables - Remove after troubleshooting */}
      <DebugEnv />
      
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Drastic Client Portal</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Manage your projects, files, and billing all in one place
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="primary" 
          onClick={() => router.push('/login')}
          className="text-lg px-8 py-3"
        >
          Sign In
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/register')}
          className="text-lg px-8 py-3"
        >
          Create Account
        </Button>
      </div>
    </div>
  );
} 