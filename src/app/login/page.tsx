'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { Button, Card } from '../../shared/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('info@drasticdigital.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Add test credentials button
  const addTestCredentials = () => {
    setEmail('info@drasticdigital.com');
    // You need to fill in the actual password as we can't hardcode it for security reasons
    setDebug("Email set to info@drasticdigital.com - please enter the password manually");
  };

  // Test supabase connection
  const testSupabaseConnection = async () => {
    setDebug('Testing Supabase connection...');
    try {
      // Try to make a simple query to verify database access
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        setDebug(`Database error: ${error.message}`);
        return;
      }
      
      setDebug(`Connection successful. Found ${data?.length || 0} profiles.`);
    } catch (error) {
      setDebug(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test supabase connection via API
  const testSupabaseViaAPI = async () => {
    setDebug('Testing Supabase via API...');
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      
      setDebug(`API Test Result: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setDebug(`API Test Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // On component mount, check if already logged in
  useEffect(() => {
    // Log environment variables available on the client-side
    console.log('[login/page.tsx - useEffect] Checking environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'found' : 'undefined',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'found' : 'undefined',
      // Service key should NOT be here
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (SECURITY RISK)' : 'undefined (expected)',
    });

    const checkAuth = async () => {
      try {
        setDebug('Checking authentication state...');
        console.log('Supabase object type:', typeof supabase);
        console.log('Supabase auth methods:', Object.keys(supabase.auth || {}));
        
        // Clear any invalid tokens first - this helps with refresh token errors
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const isRedirected = url.searchParams.has('redirectedFrom');
          
          // If redirected from protected route, likely token issue
          if (isRedirected) {
            setDebug('Detected redirection, clearing potential bad tokens...');
            try {
              // Force sign out to clear any invalid tokens
              await supabase.auth.signOut();
              
              // Clear localStorage Supabase items
              const localStorageKeys = Object.keys(localStorage);
              const supabaseKeys = localStorageKeys.filter(key => 
                key.includes('supabase') || key.includes('sb-')
              );
              
              if (supabaseKeys.length > 0) {
                supabaseKeys.forEach(key => localStorage.removeItem(key));
                setDebug(`Cleared ${supabaseKeys.length} invalid auth tokens`);
                
                // Clean the URL
                window.history.replaceState(
                  {}, 
                  document.title, 
                  '/login'
                );
              }
            } catch (e) {
              console.error('Error clearing tokens:', e);
            }
          }
        }
        
        // Check if already authenticated, redirect to dashboard
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Session error:', error);
          setDebug(`Error getting session: ${error.message}`);
          return;
        }
        
        console.log('User data:', data);
        
        if (data.user) {
          setDebug('Already logged in, redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          setDebug('Not logged in');
        }
      } catch (err) {
        console.error('Error in auth check:', err);
        setError(`Error checking authentication state: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    checkAuth();
  }, [router]);

  // Add a timeout fallback for login loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      // If button stays loading for more than 5 seconds, provide fallback
      timeoutId = setTimeout(async () => {
        if (isLoading) {
          setDebug('Loading timeout - checking auth state manually');
          
          try {
            // Check if we might actually be logged in despite UI state
            const { data, error } = await supabase.auth.getUser();
            
            if (error) {
              setDebug(`Session check error: ${error.message}`);
              setIsLoading(false);
              return;
            }
            
            if (data.user) {
              // We're actually authenticated but UI didn't update
              setDebug("Session exists but UI didn't update! Redirecting manually...");
              router.push('/dashboard');
            } else {
              setDebug('No active session found');
              setIsLoading(false);
            }
          } catch (error) {
            setDebug(`Timeout check error: ${error instanceof Error ? error.message : String(error)}`);
            setIsLoading(false);
          }
        }
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebug('Starting login process...');

    try {
      // Show which key is being used
      setDebug(`Using anon key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)}... at URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      
      // First check if we can access the profiles table 
      setDebug('Testing database connection first...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (testError) {
        setDebug(`Database error: ${testError.message}`);
        setError(`Database access error: ${testError.message}`);
        setIsLoading(false);
        return;
      }
      
      setDebug(`Database connection successful. Found ${testData?.length || 0} profiles.`);
      
      // Now attempt login
      setDebug('Calling supabase.auth.signInWithPassword...');
      
      // Check if signInWithPassword exists
      // @ts-expect-error - signInWithPassword might not be available in the type definition
      if (typeof supabase.auth.signInWithPassword !== 'function') {
        setDebug('Error: signInWithPassword method not available');
        setError('Authentication method not available. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      try {
        // @ts-expect-error - signInWithPassword might not be available in the type definition
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setDebug(`Auth error: ${authError.message}`);
          setError(authError.message || 'Invalid email or password');
          setIsLoading(false);
          return;
        }

        setDebug(`Login successful, user: ${data.user?.email}`);
        
        // Verify token was created properly
        try {
          // Verify token creation with another check
          const { data: sessionCheck, error: sessionError } = await supabase.auth.getUser();
          
          if (sessionError) {
            setDebug(`Session verification error: ${sessionError.message}`);
            setError('Login succeeded but session verification failed. Please try again.');
            setIsLoading(false);
            return;
          }
          
          if (!sessionCheck.user) {
            setDebug('Login appeared to succeed but no user is present in session check');
            setError('Authentication succeeded but session is missing. Please try again.');
            setIsLoading(false);
            return;
          }
          
          setDebug(`Session verified successfully with user ID: ${sessionCheck.user.id}`);
          
          // Add a small delay before redirecting to allow auth state to update
          setTimeout(() => {
            const redirectTo = new URLSearchParams(window.location.search).get('redirectedFrom');
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              router.push('/dashboard');
            }
          }, 500);
        } catch (verifyError) {
          setDebug(`Session verification exception: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
          setError('Login succeeded but verification failed. Please try again later.');
          setIsLoading(false);
        }
      } catch (authCallError) {
        setDebug(`Auth call error: ${authCallError instanceof Error ? authCallError.message : String(authCallError)}`);
        setError('Authentication method failed. Please try again later.');
        setIsLoading(false);
        return;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebug(`Caught error: ${errorMessage}`);
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleResetAuth = async () => {
    setDebug('Resetting auth state...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setDebug(`Sign out error: ${error.message}`);
        return;
      }
      
      setDebug('Auth state reset successfully');
      
      // Clear auth storage
      try {
        const localStorageKeys = Object.keys(localStorage);
        const supabaseKeys = localStorageKeys.filter(key => key.includes('supabase'));
        
        if (supabaseKeys.length > 0) {
          supabaseKeys.forEach(key => localStorage.removeItem(key));
          setDebug(`Cleared ${supabaseKeys.length} supabase items from localStorage`);
        } else {
          setDebug('No Supabase items found in localStorage');
        }
      } catch (error) {
        console.error('Error clearing auth storage:', error);
      }
      
      window.location.reload();
    } catch (error) {
      setDebug(`Error in reset: ${error instanceof Error ? error.message : String(error)}`);
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
                className="w-full p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {debug && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
                Debug: {debug}
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
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAuth}
                className="w-full"
              >
                Reset Auth State
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={addTestCredentials}
                className="w-full"
              >
                Use Test Email
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={testSupabaseConnection}
                className="w-full"
              >
                Test Supabase Connection
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={testSupabaseViaAPI}
                className="w-full"
              >
                Test API Key (API)
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/debug')}
                className="w-full"
              >
                Auth Debugging Page
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