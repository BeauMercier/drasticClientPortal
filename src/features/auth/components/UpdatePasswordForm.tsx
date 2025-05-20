'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from '../../../shared/ui';

interface UpdatePasswordFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function UpdatePasswordForm({ onSuccess, redirectUrl }: UpdatePasswordFormProps) {
  const { updatePassword, logout, isLoading, error } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    // Validate password length and complexity
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }
    
    const result = await updatePassword(password);
    
    if (result.success) {
      setSuccessMessage('Password updated successfully. Redirecting...');
      
      await logout();

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else if (redirectUrl) {
        setTimeout(() => {
          router.replace(redirectUrl);
        }, 2000);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-secondary-800">Update Password</h2>
          
          {(error || validationError) && (
            <div className="mb-4 p-3 bg-danger-100 border border-danger-400 text-danger-700 rounded">
              {error || validationError}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-success-100 border border-success-400 text-success-700 rounded">
              {successMessage}
            </div>
          )}
          
          <div className="mb-4">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="New Password"
              placeholder="******************"
              required
            />
          </div>
          
          <div className="mb-6">
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm New Password"
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
              Update Password
            </Button>
            
            {redirectUrl && (
              <a
                className="inline-block align-baseline font-bold text-sm text-primary-600 hover:text-primary-800"
                href={redirectUrl}
                onClick={(e) => { e.preventDefault(); if (redirectUrl) router.push(redirectUrl); }}
              >
                Cancel
              </a>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
} 