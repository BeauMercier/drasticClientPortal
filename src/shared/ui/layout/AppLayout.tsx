'use client';

import React, { useState, useEffect } from 'react';
// import Sidebar from './Sidebar';
import Header from './Header';
import { useUI } from '../../contexts/UIContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarExpanded, currentTheme } = useUI();
  const [mounted, setMounted] = useState(false);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;
    
    const htmlElement = document.documentElement;
    // Remove existing theme classes
    htmlElement.classList.remove('light', 'dark');
    
    // Apply correct theme class
    if (currentTheme === 'dark') {
      htmlElement.classList.add('dark');
    } else if (currentTheme === 'light') {
      htmlElement.classList.add('light');
    } else if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      htmlElement.classList.add(prefersDark ? 'dark' : 'light');
    }
  }, [currentTheme, mounted]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-gray-100">
        {/* Basic loading or placeholder */} 
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-100 dark:bg-black">
      <div className="w-full h-screen flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto pt-20">
          {children}
        </main>
      </div>
    </div>
  );
} 