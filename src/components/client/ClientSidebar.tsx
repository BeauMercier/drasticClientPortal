'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUI } from '@/shared/contexts/UIContext';
import { 
  HomeIcon, // For Dashboard
  UserIcon, // For My Info
  BuildingOfficeIcon, // For Business Info
  DocumentTextIcon, // For Files
  CreditCardIcon, // For Billing
  CogIcon, // For Settings
  FolderIcon, // Added for Projects
  Cog6ToothIcon, // Keep this one
  BuildingOffice2Icon, // Keep this one
  // UserIcon can be removed if not used elsewhere after the sidebar link removal
} from '@heroicons/react/24/outline';

// Client-specific menu items using the icons from AdminSidebar for consistency where applicable
const clientMenuItems = [
  { name: 'Dashboard', href: '/client', icon: <HomeIcon className="h-5 w-5" /> },
  { name: 'Projects', href: '/client/projects', icon: <FolderIcon className="h-5 w-5" /> }, // Added Projects link
  // { name: 'Business Profile', href: '/client/business-info', icon: <BuildingOfficeIcon className="h-5 w-5" /> }, // Old path
  { name: 'My Profile', href: '/client/my-profile', icon: <UserIcon className="h-5 w-5" /> }, // Link to the main profile page
  // Note: If My Info and Business Info need separate sidebar links, uncomment and adjust paths:
  // { name: 'My Info', href: '/client/my-profile/my-info', icon: <UserIcon className="h-5 w-5" /> }, 
  // { name: 'Business Profile', href: '/client/my-profile/business-info', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
  // { name: 'Files', href: '/client/files', icon: <DocumentTextIcon className="h-5 w-5" /> }, // Removed Files link
  // { name: 'Billing', href: '/client/billing', icon: <CreditCardIcon className="h-5 w-5" /> },
  // { name: 'Business Info', href: '/client/my-profile/business-info', icon: <BuildingOffice2Icon className="h-5 w-5" /> },
];

const secondaryNavigation = [
  // { name: 'Settings', href: '/client/settings', icon: <CogIcon className="h-5 w-5" /> }, // Removed deprecated settings link
];

export default function ClientSidebar() { // Renamed component
  const { sidebarExpanded, toggleSidebar } = useUI();
  const pathname = usePathname();

  return (
    // Fixed positioning and full viewport height - EXACTLY like AdminSidebar
    <div 
      className={`fixed top-0 left-0 h-screen bg-black text-white shadow-lg 
                 transition-all duration-300 ease-in-out z-40
                 ${sidebarExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-16 md:translate-x-0'}
      `}
    >
      {/* Header section - Match the main header height of 72px - HIDDEN ON MOBILE */}
      <div className="hidden md:flex items-center justify-between h-[72px] px-4 relative">
        {/* Separate border div with adjusted positioning */}
        <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gray-400"></div>
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
      <nav className="flex-grow overflow-y-auto px-2 pt-[72px] md:pt-0 md:mt-6">
        <ul className="space-y-2">
          {clientMenuItems.map((item) => { // Use clientMenuItems
            // Updated isActive logic for client base path
            const isActive = pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (sidebarExpanded && window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
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

      {/* Footer section - Can be customized for Client later if needed */}
      {/* Keep the styling structure for potential future use */}
      {/* 
      <div className={`absolute bottom-0 left-0 right-0 h-[60px] p-4 border-t border-gray-800 ${sidebarExpanded ? 'block' : 'hidden'}`}>
        // Client-specific footer content could go here
      </div> 
      */}
    </div>
  );
} 