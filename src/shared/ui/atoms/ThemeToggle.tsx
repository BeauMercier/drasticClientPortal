'use client';

import React from 'react';
import { useUI } from '../../contexts/UIContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { currentTheme, setTheme } = useUI();

  const toggleTheme = () => {
    if (currentTheme === 'light') {
      setTheme('dark');
    } else if (currentTheme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md transition-colors ${className} ${
        currentTheme === 'light' 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : currentTheme === 'dark'
          ? 'bg-black text-red-500 hover:bg-gray-900 border border-gray-900' 
          : 'bg-gray-900 text-gray-300 hover:bg-black border border-gray-800'
      }`}
      aria-label="Toggle theme"
      title={`Current theme: ${currentTheme}. Click to change.`}
    >
      {currentTheme === 'light' ? (
        <SunIcon className="h-5 w-5" />
      ) : currentTheme === 'dark' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <ComputerDesktopIcon className="h-5 w-5" />
      )}
    </button>
  );
} 