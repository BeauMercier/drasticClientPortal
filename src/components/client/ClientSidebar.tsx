'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUI } from '@/shared/contexts/UIContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  HomeIcon,   // Dashboard
  UserIcon,   // My Profile
  FolderIcon, // Projects
} from '@heroicons/react/24/outline';

// Client-specific menu items
const clientMenuItems = [
  { name: 'Dashboard',  href: '/client',          icon: <HomeIcon  className="h-5 w-5" /> },
  { name: 'Projects',   href: '/client/projects', icon: <FolderIcon className="h-5 w-5" /> },
  { name: 'My Profile', href: '/client/my-profile', icon: <UserIcon className="h-5 w-5" /> },
];

export default function ClientSidebar() {
  const { sidebarExpanded, toggleSidebar } = useUI();
  const pathname                      = usePathname();
  const { hasActionableNotification } = useNotifications();

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-black text-white shadow-lg
                  transition-all duration-300 ease-in-out z-40
                  ${
                    sidebarExpanded
                      ? 'w-64 translate-x-0'
                      : 'w-64 -translate-x-full md:w-16 md:translate-x-0'
                  }`}
    >
      {/* Header (hidden on mobile) – matches 72 px main header */}
      <div className="hidden md:flex items-center justify-between h-[72px] px-4 relative">
        {/* Bottom border */}
        <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gray-400"></div>

        {/* Logo (only when expanded) */}
        <div className={`${sidebarExpanded ? 'md:block hidden' : 'hidden'} items-center`}>
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

        {/* Collapse / Expand button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-900 transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarExpanded ? (
            /* Collapse icon (left arrow) */
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
            </svg>
          ) : (
            /* Expand icon (right arrow) */
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation (offset for 72 px header) */}
      <nav className="flex-grow overflow-y-auto px-2 pt-[72px] md:pt-0 md:mt-6">
        <ul className="space-y-2">
          {clientMenuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/client' && pathname.startsWith(item.href));

            const showProfileBadge =
              item.href === '/client/my-profile' &&
              hasActionableNotification('/client/my-profile/my-info');

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (sidebarExpanded && window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`flex items-center p-2 rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-[#ff2424] text-white'
                        : 'text-gray-300 hover:bg-[#ff2424]/20 hover:text-white'
                    }`}
                >
                  <div className="h-5 w-5 flex-shrink-0">{item.icon}</div>

                  {sidebarExpanded && (
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  )}

                  {showProfileBadge && sidebarExpanded && (
                    <span className="ml-auto inline-block h-2 w-2 rounded-full bg-red-500"></span>
                  )}

                  {showProfileBadge && !sidebarExpanded && (
                    <span className="absolute top-1 right-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer placeholder for future use */}
      {/* 
      <div
        className={`absolute bottom-0 left-0 right-0 h-[60px] p-4 border-t border-gray-800
                    ${sidebarExpanded ? 'block' : 'hidden'}`}
      >
        Client-specific footer content could go here
      </div>
      */}
    </div>
  );
}
