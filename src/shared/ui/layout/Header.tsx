'use client';

/**
 * @deprecated This component has been refactored into smaller components.
 * Please use the new implementation from src/components/Header/index.tsx instead.
 * 
 * This file will be removed in a future update.
 */

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '../atoms';
import { useUI } from '@/shared/contexts/UIContext';
import NotificationsMenu from './Header/NotificationsMenu';

export default function Header() {
  const { user } = useAuth();
  const { toggleSidebar } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  // Get page title based on current path
  const getPageTitle = () => {
    const pathSegments = pathname?.split('/').filter(Boolean) || ['dashboard'];
    const mainPath = pathSegments[0];
    let pageTitle = 'Dashboard';

    if (mainPath === 'client') {
      const clientSubPath = pathSegments[1];
      if (!clientSubPath) {
        pageTitle = 'Dashboard';
      } else {
        const clientTitles: Record<string, string> = {
          'projects': 'Projects',
          'my-profile': 'My Profile',
          'files': 'My Files',
          'billing': 'Billing & Payments',
          'settings': 'Settings'
        };
        pageTitle = clientTitles[clientSubPath] || 'Client Dashboard';
      }
    } else if (mainPath === 'admin') {
      const subPath = pathSegments[1];
      
      if (subPath === 'users') return 'User Management';
      if (subPath === 'projects') return 'Project Management';
      if (subPath === 'billing') return 'Billing Center';
      if (subPath === 'support') return 'Support Tickets';
      if (subPath === 'designers') return 'Designer Workload';
      if (subPath === 'settings') return 'System Settings';
      
      return 'Admin Dashboard';
    } else if (mainPath === 'designer') {
        const designerSubPath = pathSegments[1];
        if (designerSubPath === 'projects') return 'My Projects';
        return 'Designer Dashboard';
    } else {
        const genericTitles: Record<string, string> = {
          'dashboard': 'Dashboard',
          'files': 'My Files',
          'projects': 'Projects',
          'billing': 'Billing & Payments',
          'settings': 'Settings',
        };
        pageTitle = genericTitles[mainPath] || 'Dashboard';
    }
    return pageTitle;
  };

  // Get appropriate action button based on current path
  const getActionButton = () => {
    if (pathname === '/files') {
      return (
        <button 
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
          onClick={openFileUpload}
        >
          Upload Files
        </button>
      );
    }
    
    if (pathname === '/projects') {
      return (
        <button 
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Create Project
        </button>
      );
    }
    
    return null;
  };

  // Create a hidden file input reference
  const openFileUpload = () => {
    // Create a temporary file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.click();
    
    // Handle the file selection
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.files && target.files.length > 0) {
        // Dispatch a custom event with the selected files
        const event = new CustomEvent('file-upload-selected', { 
          detail: { files: Array.from(target.files) } 
        });
        window.dispatchEvent(event);
      }
    };
  };

  const handleLogout = async () => {
    const { logout } = useAuth();
    await logout();
    router.push('/');
  };

  // Get breadcrumb items if on admin page
  const getAdminBreadcrumbs = () => {
    if (!pathname) return null;
    
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Only show breadcrumbs for admin routes with subpages
    if (pathSegments[0] !== 'admin' || pathSegments.length <= 1) {
      return null;
    }
    
    const secondSegment = pathSegments[1];
    let secondSegmentLabel = '';
    
    // Map segment to readable label
    switch (secondSegment) {
      case 'users':
        secondSegmentLabel = 'User Management';
        break;
      case 'projects':
        secondSegmentLabel = 'Project Management';
        break;
      case 'billing':
        secondSegmentLabel = 'Billing Center';
        break;
      case 'support':
        secondSegmentLabel = 'Support Tickets';
        break;
      case 'designers':
        secondSegmentLabel = 'Designer Workload';
        break;
      case 'settings':
        secondSegmentLabel = 'System Settings';
        break;
      default:
        secondSegmentLabel = secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1);
    }
    
    return (
      <div className="flex items-center text-sm text-gray-400">
        <Link href="/admin" className="hover:text-white transition-colors">
          Admin
        </Link>
        <span className="mx-1">›</span>
        <span className="text-white">{secondSegmentLabel}</span>
      </div>
    );
  };

  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();
  const adminBreadcrumbs = getAdminBreadcrumbs();

  return (
    <header className="sticky top-0 bg-black shadow-lg h-[72px] min-h-[72px] flex-none px-6 border-b border-gray-900 z-50 flex items-center">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-md text-gray-300 hover:bg-gray-900 hover:text-white md:hidden"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white mr-2">{getPageTitle()}</h1>
            {adminBreadcrumbs}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Action Button */}
          {getActionButton()}
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <NotificationsMenu />

          {/* User Profile */}
          <div className="relative">
            <button
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white rounded-full"
              onClick={() => {
                setShowProfile(!showProfile);
              }}
            >
              <span className="sr-only">Open user menu</span>
              {user?.avatar_url ? (
                <Image
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.avatar_url} 
                  alt="User avatar"
                  width={32}
                  height={32}
                />
              ) : (
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-600">
                  <span className="text-sm font-medium leading-none text-white">{userInitial}</span>
                </span>
              )}
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-black rounded-lg shadow-xl border border-gray-900 z-10 overflow-hidden">
                <div className="p-4 border-b border-gray-900">
                  <div className="font-medium text-sm text-white">{user?.full_name || 'User'}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                </div>
                <div className="py-1">
                  <Link href="/settings/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900">
                    Profile Settings
                  </Link>
                  <Link href="/billing" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900">
                    Billing
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-900"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 