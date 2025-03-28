'use client';

import React from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className={`inline-flex items-center ${className}`}>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={handleChange}
            ref={ref}
            {...props}
          />
          <div
            className={`h-6 w-11 rounded-full transition-colors ${
              checked ? 'bg-blue-600' : 'bg-gray-300'
            } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2`}
          >
            <div
              className={`h-5 w-5 transform rounded-full bg-white transition-transform ${
                checked ? 'translate-x-5' : 'translate-x-1'
              } shadow-md mt-0.5`}
            />
          </div>
        </label>
      </div>
    );
  }
);

Switch.displayName = 'Switch'; 