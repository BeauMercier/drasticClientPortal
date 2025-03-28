'use client';

import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

// Create a context for the tabs
interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export const Tabs = ({ value, onValueChange, className = '', children, ...props }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
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
  const isSelected = context?.value === value;

  const handleClick = () => {
    if (context?.onValueChange) {
      context.onValueChange(value);
    }
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
  const isSelected = context?.value === value;

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