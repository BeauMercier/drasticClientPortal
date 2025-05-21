'use client';

import React from 'react';
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  testId?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', testId = 'loading-skeleton', ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid={testId}
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';