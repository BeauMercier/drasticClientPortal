import React from 'react';
import { cn } from '@/lib/utils/cn';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  children, 
  className,
  as: Component = 'div', 
}) => {
  return (
    <Component 
      className={cn(
        "flex h-full min-h-0 flex-col rounded-[var(--radius-lg)] border border-[hsl(var(--stroke-light))] bg-[hsl(var(--bg-medium))] p-6 text-[hsl(var(--text-light))] shadow-lg",
        className
      )}
    >
      {children}
    </Component>
  );
};