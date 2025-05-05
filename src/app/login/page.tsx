'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/api/client';
import { Button, Card } from '../../shared/ui';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { getUserProfile } from '@/lib/api/client-api';
import { UserRole } from '@/features/auth/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, isLoading: authIsLoading, error: authContextError } = useAuthContext();

  // On component mount OR when auth state changes, check if already logged in
  useEffect(() => {
    // Wait for AuthContext to finish loading
    if (authIsLoading) {
      return; 
    }

    // Check for errors from AuthContext initialization
    if (authContextError) {
      console.error("AuthContext Error:", authContextError);
      return;
    }

    // If loading is finished and user exists, fetch profile and redirect
    if (user) {
      const handleRedirect = async () => {
        try {
          console.log('User authenticated, fetching profile for redirect...');
          const profile = await getUserProfile();
          const role = profile?.role as UserRole; // Assuming role is directly on profile
          console.log('User role determined as:', role);

          let targetPath = '/'; // Default path
          switch (role) {
            case 'admin':
              targetPath = '/admin'; // Or specific admin dashboard like /admin/dashboard
              break;
            case 'designer':
              targetPath = '/designer'; // Or specific designer dashboard
              break;
            case 'client':
              targetPath = '/client'; // Or specific client dashboard
              break;
            // Add other roles like 'partner' if necessary
            default:
              console.warn(`Unknown or missing role: ${role}, redirecting to default.`);
              // Decide on a sensible default, maybe client dashboard or root
              targetPath = '/client'; // Example: Default to client dashboard
          }

          // Check for redirectedFrom query parameter (optional, might override role-based redirect)
          const redirectedFrom = new URLSearchParams(window.location.search).get('redirectedFrom');
          if (redirectedFrom) {
              console.log(`Redirecting to query parameter: ${redirectedFrom}`);
              router.push(redirectedFrom);
          } else {
              console.log(`Redirecting based on role to: ${targetPath}`);
              router.push(targetPath); 
          }

        } catch (error) {
          console.error('Failed to fetch user profile for redirect:', error);
          // Handle error - maybe redirect to a generic dashboard or show an error
          setLoginError('Could not determine user role. Redirecting to default page.');
          router.push('/'); // Fallback redirect
        }
      };

      handleRedirect();
      
    } 
    
  }, [user, authIsLoading, authContextError, router]); // Depend on context state and router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); 
    setLoginError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError('Invalid email or password. Please try again.'); 
        console.error('Supabase Auth Error:', error.message);
        setIsSubmitting(false); 
        return;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoginError('An unexpected error occurred. Please try again later.');
      console.error('Login Submit Error:', errorMessage, error);
      setIsSubmitting(false); // Ensure loading stops on unexpected error
    } 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Sign in to your account</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white disabled:opacity-75"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white disabled:opacity-75"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {loginError}
              </div>
            )}
            
            <div className="mb-4 text-right">
              <a
                href="/reset-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            
            <div className="flex flex-col gap-2 mt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
} 