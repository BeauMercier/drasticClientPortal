'use client';

import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        {checked && (
          <svg
            className="absolute left-0 top-0 h-4 w-4 text-blue-600 pointer-events-none"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l3 3 7-7"
            />
          </svg>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox'; 