'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUI } from '@/shared/contexts/UIContext';
import { 
  ShieldCheckIcon, UserGroupIcon
} from '@heroicons/react/24/outline';

// Admin-specific menu items
const adminMenuItems = [
  { name: 'Admin Dashboard', href: '/admin', icon: <ShieldCheckIcon className="h-5 w-5" /> },
  { name: 'User Management', href: '/admin/users', icon: <UserGroupIcon className="h-5 w-5" /> },
  // Add other admin-specific links here
];

export default function AdminSidebar() {
  const { sidebarExpanded, toggleSidebar } = useUI();
  const pathname = usePathname();

  return (
    // Fixed positioning and full viewport height
    <div 
      className={`fixed top-0 left-0 h-screen bg-black text-white shadow-lg transition-all duration-300 ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header section - Match the main header height of 72px */}
      <div className="flex items-center justify-between h-[72px] px-4 relative">
        {/* Separate border div with adjusted positioning */}
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
            // Collapse Icon (Left Arrow)
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          ) : (
            // Expand Icon (Right Arrow)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation: Update height calculation to account for 72px header */}
      <nav className="flex-grow overflow-y-auto mt-6">
        <ul className="space-y-2 px-2">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)); // Highlight parent routes too
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
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer section (Optional - keep generic or customize for admin) */}
      {/* 
      <div className={`absolute bottom-0 left-0 right-0 h-[60px] p-4 border-t border-gray-800 ${sidebarExpanded ? 'block' : 'hidden'}`}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#ff2424] flex items-center justify-center text-white font-medium">
            A // Or User Initial
          </div>
          <div>
            <div className="text-sm font-medium">Admin User</div> 
            <div className="text-xs text-gray-400">admin@example.com</div> 
          </div>
        </div>
      </div> 
      */}
    </div>
  );
} 