'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UIContextType {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  isLoading: boolean;
}

const defaultContext: UIContextType = {
  sidebarExpanded: true,
  toggleSidebar: () => {},
  currentTheme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  isLoading: true,
};

const UIContext = createContext<UIContextType>(defaultContext);

export const useUI = () => useContext(UIContext);

export default function UIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Toggle sidebar expanded state
  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
    // Store preference in local storage
    localStorage.setItem('sidebarExpanded', (!sidebarExpanded).toString());
  };

  // Set theme and store in local storage
  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme immediately
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    } else {
      setResolvedTheme(theme);
      applyTheme(theme);
    }
  };

  // Helper to apply theme to document
  const applyTheme = (theme: 'light' | 'dark') => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (currentTheme === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        applyTheme(newTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme, mounted]);

  // Initialize from local storage and set up theme
  useEffect(() => {
    setMounted(true);
    
    // Load sidebar preference
    const storedSidebarState = localStorage.getItem('sidebarExpanded');
    if (storedSidebarState !== null) {
      setSidebarExpanded(storedSidebarState === 'true');
    }
    
    // Load theme preference
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setCurrentTheme(storedTheme);
    }
    
    // Apply initial theme
    const initialTheme = storedTheme || 'system';
    if (initialTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(initialTheme as 'light' | 'dark');
    }
    
    setIsLoading(false);
  }, []);

  // Apply theme effect
  useEffect(() => {
    if (!mounted) return;
    applyTheme(resolvedTheme);
  }, [resolvedTheme, mounted]);

  return (
    <UIContext.Provider
      value={{
        sidebarExpanded,
        toggleSidebar,
        currentTheme,
        setTheme,
        resolvedTheme,
        isLoading,
      }}
    >
      {children}
    </UIContext.Provider>
  );
} 