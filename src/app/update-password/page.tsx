'use client';

import React from 'react';
import { UpdatePasswordForm } from '../../features/auth';

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Update Password</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new password for your account</p>
      </div>
      
      <UpdatePasswordForm redirectUrl="/login" />
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          This page is available only through the password reset link sent to your email.
        </p>
      </div>
    </div>
  );
} 