'use client';

import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-blue-50 border-blue-200 text-blue-800',
      destructive: 'bg-red-50 border-red-200 text-red-800',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  }
);

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className = '', ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm opacity-90 ${className}`}
      {...props}
    />
  )
);

Alert.displayName = 'Alert';
AlertTitle.displayName = 'AlertTitle';
AlertDescription.displayName = 'AlertDescription'; 