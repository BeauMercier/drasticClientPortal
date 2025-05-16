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
import { BellIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '../atoms';

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  // Fetch user profile to get avatar URL
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data?.avatar_url) {
          setUserAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
    
    loadProfile();
  }, [user?.id]);

  // Get page title based on current path
  const getPageTitle = () => {
    const pathSegments = pathname?.split('/').filter(Boolean) || ['dashboard'];
    const mainPath = pathSegments[0];
    
    // Special handling for admin section
    if (mainPath === 'admin') {
      const subPath = pathSegments[1];
      
      if (subPath === 'users') return 'User Management';
      if (subPath === 'projects') return 'Project Management';
      if (subPath === 'billing') return 'Billing Center';
      if (subPath === 'support') return 'Support Tickets';
      if (subPath === 'designers') return 'Designer Workload';
      if (subPath === 'settings') return 'System Settings';
      
      return 'Admin Dashboard';
    }
    
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'files': 'My Files',
      'projects': 'Projects',
      'billing': 'Billing & Payments',
      'settings': 'Settings',
    };
    
    return titles[mainPath] || 'Dashboard';
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
    await supabase.auth.signOut();
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
    <header className="bg-black shadow-lg py-4 px-6 border-b border-gray-900 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
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
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showProfile) setShowProfile(false);
              }}
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6 text-gray-300" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-black rounded-lg shadow-xl border border-gray-900 z-10 overflow-hidden">
                <div className="p-4 border-b border-gray-900 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <div className="bg-red-900 text-red-100 text-xs font-medium px-2.5 py-0.5 rounded-full">3 new</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-900 hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-900 rounded-full p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-100" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">New message from support</p>
                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-b border-gray-900 hover:bg-gray-900 transition-colors cursor-pointer">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-green-900 rounded-full p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-100" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Your invoice is ready</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 text-center border-t border-gray-900 bg-black">
                  <Link href="/notifications" className="text-sm text-red-400 hover:underline">View all notifications</Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white rounded-full"
              onClick={() => {
                setShowProfile(!showProfile);
                if (showNotifications) setShowNotifications(false);
              }}
            >
              <span className="sr-only">Open user menu</span>
              {userAvatarUrl ? (
                <Image
                  className="h-8 w-8 rounded-full object-cover"
                  src={userAvatarUrl} 
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