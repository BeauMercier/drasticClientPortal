import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  id: string;
  helpText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const baseClasses = 'appearance-none relative block px-3 py-2 border placeholder-secondary-500 text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm';
  const widthClasses = fullWidth ? 'w-full' : '';
  const errorClasses = error ? 'border-danger-300' : 'border-secondary-300';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${baseClasses} ${widthClasses} ${errorClasses} ${className} rounded-md`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-secondary-500">{helpText}</p>
      )}
    </div>
  );
};

export default Input; 