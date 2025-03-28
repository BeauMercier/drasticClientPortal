'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types';
import { Button, Input, Card } from '../../../shared/ui';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function LoginForm({ onSuccess, redirectUrl }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setDebugInfo(null);
    setAttemptedLogin(true);
    
    // Basic validation
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    const credentials: LoginCredentials = {
      email,
      password
    };
    
    setDebugInfo(`Attempting login with email: ${email}`);
    console.log('Login attempt with:', { email });
    
    try {
      const result = await login(credentials);
      console.log('Login result:', result);
      setDebugInfo(prev => `${prev}\nResult: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        setDebugInfo(prev => `${prev}\nLogin successful! Redirecting to ${redirectUrl || 'callback'}`);
        
        // Add a slight delay to show the success message
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (redirectUrl) {
            window.location.href = redirectUrl;
          }
        }, 1000);
      } else {
        // Set more user-friendly error message
        if (result.error?.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please try again.');
        } else if (result.error?.includes('Email not confirmed')) {
          setFormError('Please verify your email address before logging in.');
        } else {
          setFormError(result.error || 'An error occurred during login. Please try again.');
        }
        console.error('Login error:', result.error);
        setDebugInfo(prev => `${prev}\nError: ${result.error}`);
      }
    } catch (error) {
      console.error('Exception during login:', error);
      setFormError('An unexpected error occurred. Please try again.');
      setDebugInfo(prev => `${prev}\nException: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const addTestUser = async () => {
    try {
      setEmail('test@example.com');
      setPassword('Password123!');
      setDebugInfo('Added test credentials - this is for testing purposes only.');
    } catch (error) {
      console.error('Error setting test user:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-secondary-800">Login</h2>
          
          {(error || formError) && (
            <div className="mb-4 p-3 bg-danger-100 border border-danger-400 text-danger-700 rounded">
              {formError || error}
            </div>
          )}
          
          {attemptedLogin && !error && !formError && !isLoading && (
            <div className="mb-4 p-3 bg-info-100 border border-info-400 text-info-700 rounded">
              Checking credentials...
            </div>
          )}
          
          <div className="mb-4">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormError(null);
              }}
              label="Email"
              placeholder="email@example.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError(null);
              }}
              label="Password"
              placeholder="******************"
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <a
              className="inline-block align-baseline font-bold text-sm text-primary-600 hover:text-primary-800"
              href="/reset-password"
            >
              Forgot Password?
            </a>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button 
                variant="ghost" 
                type="button"
                onClick={addTestUser} 
                className="text-xs"
              >
                Fill Test Credentials
              </Button>
              
              {debugInfo && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">
                  {debugInfo}
                </div>
              )}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
} 