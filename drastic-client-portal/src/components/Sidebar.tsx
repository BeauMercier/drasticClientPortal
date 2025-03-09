'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  HomeIcon, 
  UserIcon, 
  QuestionMarkCircleIcon, 
  CreditCardIcon, 
  FolderIcon, 
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={`bg-gray-800 text-white h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <div className="text-xl font-bold">Client Portal</div>}
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="mt-8">
        <ul className="space-y-2 px-2">
          <li>
            <Link 
              href="/dashboard" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${isActive('/dashboard') ? 'bg-blue-600' : ''}`}
            >
              <HomeIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/my-info" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${isActive('/my-info') ? 'bg-blue-600' : ''}`}
            >
              <UserIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">My Info</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/support" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${isActive('/support') ? 'bg-blue-600' : ''}`}
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Support</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/billing" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${isActive('/billing') ? 'bg-blue-600' : ''}`}
            >
              <CreditCardIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Billing</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/files" 
              className={`flex items-center p-2 rounded-md hover:bg-gray-700 ${isActive('/files') ? 'bg-blue-600' : ''}`}
            >
              <FolderIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Files</span>}
            </Link>
          </li>
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/settings" 
              className="flex items-center p-2 rounded-md hover:bg-gray-700"
            >
              <Cog6ToothIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Settings</span>}
            </Link>
          </li>
          <li>
            <button 
              onClick={() => signOut()}
              className="flex items-center p-2 rounded-md hover:bg-gray-700 w-full text-left"
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
} 