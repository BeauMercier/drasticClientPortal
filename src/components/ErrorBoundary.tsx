'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import logger from '@/lib/logger';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching and handling client-side errors
 * Prevents the entire app from crashing when an error occurs in a component
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging service
    logger.error('React component error caught by ErrorBoundary', {
      data: {
        error,
        componentStack: errorInfo.componentStack
      }
    });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI when an error occurs
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 max-w-3xl mx-auto my-8">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex space-x-4">
            <Button onClick={this.resetError} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
          
          {/* Only show the stack trace in development */}
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md overflow-auto">
              <p className="text-sm font-medium mb-2">Error details (only visible in development):</p>
              <pre className="text-xs text-red-800 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 