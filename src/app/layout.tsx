import '../styles/globals.css';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../features/auth';
import UIProvider from '../shared/contexts/UIContext';
import AppLayout from '../shared/ui/layout/AppLayout';
import { ToastProvider } from '@/components/ui/use-toast';
import { reportEnvValidation } from '@/lib/env';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnvFallback from '@/components/EnvFallback';

// Validate environment variables during server rendering
if (typeof window === 'undefined') {
  reportEnvValidation();
}

export const metadata = {
  title: 'Drastic Client Portal',
  description: 'Client portal for managing projects, files, and billing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-100 dark:bg-black">
        <ToastProvider>
          <UIProvider>
            <AuthProvider>
              <ErrorBoundary>
                <EnvFallback />
                <AppLayout>
                  {children}
                </AppLayout>
              </ErrorBoundary>
              <Toaster position="top-right" />
            </AuthProvider>
          </UIProvider>
        </ToastProvider>
      </body>
    </html>
  );
} 