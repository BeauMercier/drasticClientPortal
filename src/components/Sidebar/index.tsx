'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/api/client-api';
import { UserRole } from '@/features/auth/types';
import { useUI } from '@/shared/contexts/UIContext';
import { 
  UserIcon, BuildingOfficeIcon, DocumentTextIcon, CreditCardIcon, 
  HomeIcon, CalendarIcon, ClipboardDocumentListIcon,
  ShieldCheckIcon, UserGroupIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';

// Role-specific menu items
const designerMenuItems = [
  { name: 'Dashboard', href: '/designer/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
  { name: 'Calendar', href: '/designer/calendar', icon: <CalendarIcon className="h-5 w-5" /> },
  { name: 'Tasks', href: '/designer/tasks', icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
  { name: 'Projects', href: '/designer/projects', icon: <BriefcaseIcon className="h-5 w-5" /> },
];

const clientMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
  { name: 'My Info', href: '/my-profile/my-info', icon: <UserIcon className="h-5 w-5" /> },
  { name: 'Business Profile', href: '/my-profile/business-info', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
  { name: 'Files', href: '/files', icon: <DocumentTextIcon className="h-5 w-5" /> },
  { name: 'Billing', href: '/billing', icon: <CreditCardIcon className="h-5 w-5" /> },
];

const adminMenuItems = [
  { name: 'Admin Dashboard', href: '/admin', icon: <ShieldCheckIcon className="h-5 w-5" /> },
  { name: 'User Management', href: '/admin/users', icon: <UserGroupIcon className="h-5 w-5" /> },
];

const partnerMenuItems = [
  { name: 'Partner Dashboard', href: '/partner', icon: <HomeIcon className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { sidebarExpanded, toggleSidebar } = useUI();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const profile = await getUserProfile();
        const roleFromProfile = profile?.role as UserRole;
        if (roleFromProfile && ['admin', 'designer', 'client', 'partner'].includes(roleFromProfile)) {
          setUserRole(roleFromProfile);
        } else {
          setUserRole('client');
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setUserRole('client');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, []);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which menu items to show based on role
  let navigationItems = clientMenuItems;
  if (userRole === 'designer') navigationItems = designerMenuItems;
  else if (userRole === 'admin') navigationItems = adminMenuItems;
  else if (userRole === 'partner') navigationItems = partnerMenuItems;

  // Loading state - simplified
  if (!mounted || isLoading) {
    return (
      <div className="fixed top-0 left-0 h-screen w-64 bg-black animate-pulse" />
    );
  }

  return (
    // Fixed positioning and full viewport height
    <div 
      className={`fixed top-0 left-0 h-screen bg-black text-white shadow-lg transition-all duration-300 ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header section - Match the main header height of 72px */}
      <div className="flex items-center justify-between h-[72px] px-4 relative">
        {/* Separate border div with adjusted positioning to ensure perfect alignment */}
        <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gray-400"></div>
        <div className={`${sidebarExpanded ? 'block' : 'hidden'} items-center`}>
          <div className="relative w-[160px] h-[45px] brightness-0 invert">
            <Image 
              src="/images/logos/Asset 1.svg"
              alt="Drastic Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-900 transition-colors"
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

      {/* Navigation: Update height calculation to account for 72px header */}
      <nav className="h-[calc(100vh-72px-60px)] overflow-y-auto mt-6">
        <ul className="space-y-2 px-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-[#ff2424] text-white' 
                      : 'text-gray-300 hover:bg-[#ff2424]/20 hover:text-white'
                  }`}
                >
                  <div className="h-5 w-5 flex-shrink-0">
                    {item.icon}
                  </div>
                  
                  {sidebarExpanded && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer section at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-[60px] p-4 border-t border-gray-800 ${sidebarExpanded ? 'block' : 'hidden'}`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#ff2424] flex items-center justify-center text-white font-medium">
            U
          </div>
          <div>
            <div className="text-sm font-medium">User Name</div>
            <div className="text-xs text-gray-400">user@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
