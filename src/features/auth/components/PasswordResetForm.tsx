'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ResetPasswordRequest } from '../types';
import { Button, Input, Card } from '../../../shared/ui';

interface PasswordResetFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function PasswordResetForm({ onSuccess, redirectUrl }: PasswordResetFormProps) {
  const { resetPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const data: ResetPasswordRequest = {
      email
    };
    
    const result = await resetPassword(data);
    
    if (result.success) {
      setSuccessMessage('Check your email for the password reset link');
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 3000);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-secondary-800">Reset Password</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-danger-100 border border-danger-400 text-danger-700 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-success-100 border border-success-400 text-success-700 rounded">
              {successMessage}
            </div>
          )}
          
          <div className="mb-6">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              placeholder="email@example.com"
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
              Send Reset Link
            </Button>
            
            <a
              className="inline-block align-baseline font-bold text-sm text-primary-600 hover:text-primary-800"
              href={redirectUrl || "/login"}
            >
              Back to Login
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
} 