import '../styles/globals.css';
import React from 'react';
import { ToastProvider } from '@/components/ui/use-toast';
import { AuthProvider } from '../features/auth';
import UIProvider from '../shared/contexts/UIContext';
import { reportEnvValidation } from '@/lib/env';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnvFallback from '@/components/EnvFallback';
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
// import { Inter } from "next/font/google";

// Validate environment variables during server rendering
if (typeof window === 'undefined') {
  reportEnvValidation();
}

export const metadata: Metadata = {
  title: 'Drastic Client Portal',
  description: 'Client portal for managing projects, files, and billing',
  // themeColor: [
  //   { media: '(prefers-color-scheme: light)', color: 'white' },
  //   { media: '(prefers-color-scheme: dark)', color: 'black' },
  // ],
  icons: {
    icon: '/images/logos/Asset 5@4x-8.png',
    shortcut: '/images/logos/Asset 5@4x-8.png',
    apple: '/images/logos/Asset 5@4x-8.png',
  },
  // manifest: `${siteConfig.url}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <UIProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <>
                    <EnvFallback />
                    {children}
                  </>
                </ErrorBoundary>
              </AuthProvider>
            </UIProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 