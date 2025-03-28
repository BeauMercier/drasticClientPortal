'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { RegisterData } from '../types';
import { Button, Input, Card } from '../../../shared/ui';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function RegisterForm({ onSuccess, redirectUrl }: RegisterFormProps) {
  const { register, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
    
    const data: RegisterData = {
      email,
      password,
      full_name: fullName
    };
    
    const result = await register(data);
    
    if (result.success) {
      setSuccessMessage('Registration successful! Please check your email to confirm your account.');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6 text-secondary-800">Create Your Account</h2>
          
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
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              label="Full Name"
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="mb-4">
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
          
          <div className="mb-4">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
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
              label="Confirm Password"
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
              Register
            </Button>
            
            <a
              className="inline-block align-baseline font-bold text-sm text-primary-600 hover:text-primary-800"
              href="/login"
            >
              Already have an account?
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
} 