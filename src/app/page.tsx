'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../features/auth';
import { roleBasePaths } from '@/lib/config/auth-config';
import { Button } from '../shared/ui';
import Image from 'next/image';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = user.role;
      const redirectPath = roleBasePaths[userRole];

      if (redirectPath) {
        router.push(redirectPath);
      } else {
        console.warn(`No redirect path defined for role: ${userRole}. Staying on home page.`);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-3 border-red-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-[linear-gradient(to_bottom_right,theme(colors.black),theme(colors.blue.600),theme(colors.gray.500),theme(colors.red.600))] order-2 md:order-1">
        <Image 
            src="/images/logos/Asset 1.svg" 
            alt="Drastic Client Portal Logo" 
            width={240} 
            height={34} 
            className="mb-8" 
            priority
        />
        <div className="text-center">
           <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Drastic Client Portal</h1>
           <p className="text-lg md:text-xl text-gray-200 max-w-md">
             Manage your projects, files, and billing all in one place
           </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 order-1 md:order-2">
        <div className="text-center w-full max-w-xs">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Welcome to the Client Portal</h2>
            <Button 
              variant="primary" 
              onClick={() => router.push('/login')}
              className="w-full text-lg px-8 py-3 mb-4"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { /* TODO: Implement Contact Support action */ alert('Contact Support clicked!'); }}
              className="w-full text-lg px-8 py-3"
            >
              Contact Support
            </Button>
        </div>
      </div>
    </div>
  );
} 