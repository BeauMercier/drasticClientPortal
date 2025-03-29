'use client';

/**
 * @deprecated This component has been refactored into smaller components.
 * Please use the new implementation from src/components/Sidebar/index.tsx instead.
 * 
 * This file will be removed in a future update.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUI } from '../../contexts/UIContext';
import { useAuthContext } from '@/features/auth/contexts/AuthContext';

// Define navigation item types
type NavigationChild = {
  name: string;
  href: string;
};

type NavigationItem = {
  name: string;
  icon: string;
  href?: string;
  children?: NavigationChild[];
};

// Define client navigation structure
const clientNavigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    name: 'Management', 
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    children: [
      { name: 'Website', href: '/management/website' },
      { name: 'Google Ads', href: '/management/google-ads' },
      { name: 'Analytics', href: '/management/analytics' }
    ]
  },
  { 
    name: 'Projects', 
    href: '/projects',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
  },
  { 
    name: 'My Profile', 
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    children: [
      { name: 'My Info', href: '/my-info' },
      { name: 'Business Info', href: '/business-info' },
      { name: 'Files', href: '/files' },
      { name: 'Billing', href: '/billing' }
    ]
  },
  { 
    name: 'Support', 
    href: '/dashboard', 
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' 
  },
];

// Define designer navigation structure
const designerNavigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/designer/dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
  },
  { 
    name: 'Projects', 
    href: '/designer/projects', 
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' 
  },
  { 
    name: 'Calendar', 
    href: '/designer/calendar', 
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
  },
  { 
    name: 'Tasks', 
    href: '/designer/tasks', 
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
  },
];

export default function Sidebar() {
  const { sidebarExpanded, toggleSidebar } = useUI();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { user, isLoading: authIsLoading } = useAuthContext();
  const [isDesigner, setIsDesigner] = useState(false);
  
  // Check the user's role based on the context user
  useEffect(() => {
    // Wait for auth context to finish loading and ensure user exists
    if (authIsLoading) {
      // console.log('Sidebar - Auth context still loading...');
      return; // Wait until auth context is ready
    }
    
    // console.log('Sidebar - Auth context loaded. User:', user);

    if (user && user.role) {
      // Use pattern matching to check if the role contains 'design' (case insensitive)
      if (typeof user.role === 'string' && user.role.toLowerCase().includes('design')) {
        // console.log('Sidebar - User is a designer (from context)');
        setIsDesigner(true);
      } else {
        // console.log('Sidebar - User is NOT a designer (from context)');
        setIsDesigner(false);
      }
    } else {
      // No user or role found in context
      // console.log('Sidebar - No user or role found in context');
      setIsDesigner(false);
    }
  }, [user, authIsLoading]); // Depend on user and loading state from context

  // Use the appropriate navigation items based on the user's role
  const navigationItems = isDesigner ? designerNavigationItems : clientNavigationItems;

  // Avoid hydration mismatch & set initial menu state
  useEffect(() => {
    setMounted(true);
    
    // Initialize expanded state based on current route
    const newExpandedState: Record<string, boolean> = {};
    navigationItems.forEach(item => {
      if (item.children) {
        const shouldExpand = item.children.some(child => pathname === child.href || 
            (item.name === 'My Profile' && (pathname === '/my-profile' && child.href === '/my-info')));
        if (shouldExpand) {
          newExpandedState[item.name] = true;
        }
      }
    });
    setExpandedMenus(newExpandedState);
    // We don't depend on authIsLoading here, menu structure depends on role only
  }, [pathname, navigationItems]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Show loading state based on mount status OR auth loading status
  if (!mounted || authIsLoading) {
    return (
      <div className="h-screen bg-black w-16 fixed top-0 left-0 z-30">
        <div className="h-full animate-pulse bg-black"></div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed top-0 left-0 h-screen bg-black text-white z-30 transition-all duration-300 ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className="h-[72px] flex items-center px-4 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-gray-900"></div>
        <div className={`${sidebarExpanded ? 'flex' : 'hidden'} items-center h-full`}>
          <Image 
            src="/images/logos/Asset 1.svg" 
            alt="Drastic Portal Logo" 
            width={130} 
            height={32} 
            className="h-7 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        
        <button 
          onClick={toggleSidebar}
          className={`${sidebarExpanded ? 'ml-auto' : 'mx-auto'} p-2 rounded-md hover:bg-gray-900 transition-colors`}
          aria-label="Toggle sidebar"
        >
          {sidebarExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <nav className="mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <ul className="space-y-2 px-2">
          {navigationItems.map((item) => {
            const isParentActive = pathname === item.href;
            const hasChildren = !!item.children?.length;
            const isAnyChildActive = hasChildren && item.children ? item.children.some(child => pathname === child.href) : false;
            const isExpanded = expandedMenus[item.name];
            
            return (
              <li key={item.name} className="mb-1">
                {/* Parent Item */}
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                      isParentActive || isAnyChildActive
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      
                      {sidebarExpanded && (
                        <span className="ml-3">{item.name}</span>
                      )}
                    </div>
                    
                    {sidebarExpanded && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      isParentActive 
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    
                    {sidebarExpanded && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                )}
                
                {/* Children Items */}
                {hasChildren && sidebarExpanded && isExpanded && item.children && (
                  <ul className="mt-1 pl-6 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href;
                      
                      return (
                        <li key={child.name}>
                          <Link
                            href={child.href}
                            className={`flex items-center py-1 px-2 rounded-md text-sm transition-colors ${
                              isChildActive 
                                ? 'text-red-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-900 ${sidebarExpanded ? 'block' : 'hidden'}`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white font-medium">
            U
          </div>
          <div>
            <p className="text-sm font-medium text-white">User</p>
            <p className="text-xs text-gray-400">Account</p>
          </div>
        </div>
      </div>
    </div>
  );
} 