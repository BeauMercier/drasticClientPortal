'use client';

import React from 'react';

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'> {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface RadioItemProps {
  value: string;
  checked?: boolean;
  onChange?: () => void;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className = '', value, onValueChange, children, ...props }, ref) => {
    const handleRadioChange = (childValue: string) => {
      if (onValueChange) {
        onValueChange(childValue);
      }
    };

    // Clone children and pass down props
    const enhancedChildren = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          checked: value === child.props.value,
          onChange: () => handleRadioChange(child.props.value),
        } as RadioItemProps);
      }
      return child;
    });

    return (
      <div
        className={`space-y-2 ${className}`}
        ref={ref}
        role="radiogroup"
        {...props}
      >
        {enhancedChildren}
      </div>
    );
  }
);

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  className?: string;
  checked?: boolean;
  onChange?: () => void;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className = '', id, value, checked, onChange, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="radio"
          className={`h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
          id={id || `radio-${value}`}
          value={value}
          checked={checked}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        {checked && (
          <div className="absolute h-2 w-2 rounded-full bg-blue-600" style={{ left: '0.5rem', top: '0.5rem' }} />
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
RadioGroupItem.displayName = 'RadioGroupItem'; 