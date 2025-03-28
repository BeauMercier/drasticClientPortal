'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        className={`p-6 border-b border-gray-200 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        className={`text-xl font-semibold text-gray-900 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <p
        className={`text-sm text-gray-500 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        className={`p-6 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent'; 