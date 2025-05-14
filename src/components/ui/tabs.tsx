'use client';

import React, { useState, useEffect } from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Create a context for the tabs
interface TabsContextValue {
  activeValue: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export const Tabs = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  className = '',
  children,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  // Determine the effective value: controlled takes precedence
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  // Handle value changes
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    // If not controlled, update internal state
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
  };

  // Effect to update internal state if defaultValue changes (though rare for defaultValue)
  useEffect(() => {
    if (controlledValue === undefined && defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, controlledValue]);

  return (
    <TabsContext.Provider value={{ activeValue, onValueChange: handleValueChange }}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const TabsList = ({ className = '', children, ...props }: TabsListProps) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
}

export const TabsTrigger = ({
  value,
  className = '',
  children,
  ...props
}: TabsTriggerProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within a TabsProvider');
  }
  const isSelected = context.activeValue === value;

  const handleClick = () => {
    context.onValueChange(value);
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-white text-blue-700 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
}

export const TabsContent = ({
  value,
  className = '',
  children,
  ...props
}: TabsContentProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within a TabsProvider');
  }
  const isSelected = context.activeValue === value;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      data-state={isSelected ? 'active' : 'inactive'}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}; 