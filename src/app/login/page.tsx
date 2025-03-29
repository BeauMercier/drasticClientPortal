'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/api/client';
import { Button, Card } from '../../shared/ui';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('info@drasticdigital.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, isLoading: authIsLoading, error: authContextError } = useAuthContext();

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

  // On component mount OR when auth state changes, check if already logged in
  useEffect(() => {
    // Log environment variables (optional, can be removed)
    console.log('[login/page.tsx - useEffect] Checking environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'found' : 'undefined',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'found' : 'undefined',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND (SECURITY RISK)' : 'undefined (expected)',
    });
    
    // Wait for AuthContext to finish loading
    if (authIsLoading) {
      setDebug('Auth context loading...');
      return; 
    }

    // Check for errors from AuthContext initialization
    if (authContextError) {
      setDebug(`AuthContext error: ${authContextError}`);
      // Optionally setLoginError(authContextError); if needed
      return;
    }

    // If loading is finished and user exists, redirect
    if (user) {
      setDebug('User found in context, redirecting to dashboard...');
      // Add a small delay to ensure state propagation if needed
      // setTimeout(() => { 
          const redirectTo = new URLSearchParams(window.location.search).get('redirectedFrom');
          router.push(redirectTo || '/dashboard'); 
      // }, 50); // Minimal delay
    } else {
      setDebug('No user found in context, staying on login page.');
    }
    
  }, [user, authIsLoading, authContextError, router]); // Depend on context state and router

  // Add a timeout fallback for login FORM submission loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isSubmitting) { // Use the form submission loading state here
      timeoutId = setTimeout(() => {
        if (isSubmitting) {
          setDebug('Form submission timeout - check console/network');
          // Don't check auth state here, just reset form loading
          setIsSubmitting(false); 
          setLoginError('Login took too long. Please try again.');
        }
      }, 10000); // Increased timeout for submission
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Use form submission loading state
    setLoginError(null);
    setDebug('Starting login process...');

    try {
      // Use the login function from AuthContext if available, 
      // otherwise use the direct API call as before.
      // For now, keeping the direct API call logic:
      
      setDebug(`Using anon key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)}... at URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      
      // Test connection (optional)
      // setDebug('Testing database connection first...');
      // const { error: testError } = await supabase.from('profiles').select('id').limit(1);
      // if (testError) { ... }
      
      setDebug('Calling supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setDebug(`Auth error: ${error.message}`);
        setLoginError(error.message || 'Invalid email or password');
        setIsSubmitting(false); // Stop submitting on error
        return;
      }
      
      setIsSubmitting(false); // Stop submitting on success
      setDebug(`Login API call successful, user: ${data.user?.email}`);
      
      // REMOVE THE IMMEDIATE POST-LOGIN VERIFICATION BLOCK BELOW
      /*
      // Verify token was created properly
      try {
        // Verify token creation with another check
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError) {
          setDebug(`Session verification error: ${sessionError.message}`);
          setLoginError('Login succeeded but session verification failed. Please try again.');
          setIsSubmitting(false); // Ensure loading stops here too
          return;
        }
        
        if (!sessionCheck.user) {
          setDebug('Login appeared to succeed but no user is present in session check');
          setLoginError('Authentication succeeded but session is missing. Please try again.');
          setIsSubmitting(false); // Ensure loading stops here too
          return;
        }
        
        setDebug(`Session verified successfully with user ID: ${sessionCheck.user.id}`);
        
        // Redirect logic was here, but is now handled by the useEffect listening to AuthContext
        // setTimeout(() => { ... router.push ... }, 500);

      } catch (verifyError) {
        setDebug(`Session verification exception: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`);
        setLoginError('Login succeeded but verification failed. Please try again later.');
        // No need to setIsSubmitting(false) here as it was set above
      }
      */
      // Trust AuthContext listener and the other useEffect to handle redirect.

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebug(`Caught error: ${errorMessage}`);
      setLoginError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
      setIsSubmitting(false); // Ensure loading stops on error
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
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {loginError}
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
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
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