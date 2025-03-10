'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Component to handle reading search params
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user was redirected from registration page
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Account created successfully! You can now sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {successMessage && (
        <div className="rounded-md bg-green-900 border border-green-700 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md -space-y-px">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-400 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-400 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-900 border border-red-700 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-700 rounded bg-gray-900"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-red-500 hover:text-red-400">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black">
      {/* Left side - Branding section (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-black via-gray-900 to-red-950 flex-col items-center justify-center p-8">
        <div className="z-10 flex flex-col items-center justify-center h-full">
          <Image
            src="/images/logos/drastic-logo.svg"
            alt="Drastic Digital Logo"
            width={300}
            height={100}
            priority
            className="mb-8"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
            Welcome Back
          </h2>
          <div className="w-16 h-1 bg-red-600 mb-8"></div>
          <p className="text-gray-300 text-center max-w-md">
            Access your projects, files, and digital assets securely in one place.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo for mobile view */}
          <div className="md:hidden flex justify-center mb-6">
            <Image
              src="/images/logos/drastic-logo.svg"
              alt="Drastic Digital Logo"
              width={200}
              height={80}
              priority
            />
          </div>

          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Or{' '}
              <Link href="/register" className="font-medium text-red-500 hover:text-red-400">
                register for a new account
              </Link>
            </p>
          </div>
          
          <Suspense fallback={<div className="text-center py-4 text-gray-400">Loading...</div>}>
            <LoginForm />
          </Suspense>
          
          <div className="mt-6 flex justify-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 