'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/api/client';
import { Button, Card } from '../../shared/ui';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';
import { getUserProfile } from '@/lib/api/client-api';
import { UserRole } from '@/features/auth/types';
import { roleBasePaths } from '@/lib/config/auth-config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, isLoading: authIsLoading, error: authContextError } = useAuthContext();

  useEffect(() => {
    if (authIsLoading) {
      return;
    }
    if (authContextError) {
      console.error("AuthContext Error:", authContextError);
      return;
    }

    if (user) { // user is from useAuthContext(), user.role should be reliable now
      console.log(`Login page: User authenticated. Role from AuthContext: ${user.role}`);
      
      const role = user.role; // Use role from AuthContext

      // If the user's role is 'guest' and they are on the login page,
      // do not redirect them away from login. Let them stay.
      if (role === 'guest' && window.location.pathname.startsWith('/login')) {
        console.log('Login page: User role is "guest". No redirect from login page.');
        return; 
      }

      let targetPath = '/'; // Default path if no specific role match for dashboard

      switch (role) {
        case 'admin':
          targetPath = '/admin';
          break;
        case 'designer':
          targetPath = '/designer';
          break;
        case 'client':
          targetPath = '/client';
          break;
        case 'partner': 
          targetPath = roleBasePaths.partner || '/'; 
          break;
        case 'guest':
          console.log('Login page effect: User role is "guest". Setting target to homepage.');
          targetPath = '/'; 
          break;
        default:
          console.warn(`Login page effect: Unknown or unhandled role: "${role}". Redirecting to homepage.`);
          targetPath = '/'; 
      }

      const redirectedFrom = new URLSearchParams(window.location.search).get('redirectedFrom');
      
      if (redirectedFrom && redirectedFrom !== window.location.pathname) {
          console.log(`Login page: Redirecting to query parameter: ${redirectedFrom}`);
          router.replace(redirectedFrom);
      } else if (targetPath !== window.location.pathname) {
          console.log(`Login page: Redirecting based on role "${role}" to: ${targetPath}`);
          router.replace(targetPath); 
      } else {
          console.log(`Login page: User (${role}) already on target path or no redirect needed (${window.location.pathname}).`);
      }
    }
  }, [user, authIsLoading, authContextError, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); 
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
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