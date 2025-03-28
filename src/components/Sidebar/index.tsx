import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserIcon, BuildingOfficeIcon, DocumentTextIcon, CreditCardIcon, HomeIcon, CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/api/client-api';

const designerMenuItems = [
  {
    title: 'Dashboard',
    href: '/designer/dashboard',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    title: 'Calendar',
    href: '/designer/calendar',
    icon: <CalendarIcon className="h-5 w-5" />,
  },
  {
    title: 'Tasks',
    href: '/designer/tasks',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
];

const clientMenuItems = [
  {
    title: 'My Info',
    href: '/my-profile/my-info',
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    title: 'Business Profile',
    href: '/my-profile/business-info',
    icon: <BuildingOfficeIcon className="h-5 w-5" />,
  },
  {
    title: 'Files',
    href: '/files',
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesigner, setIsDesigner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check the user's role directly
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setIsLoading(true);
        const profile = await getUserProfile();
        console.log('UserProfile from API:', profile);
        console.log('Role value:', profile?.role);
        console.log('Role type:', typeof profile?.role);
        
        // Use pattern matching to check if the role contains 'design' (case insensitive)
        if (profile && profile.role && typeof profile.role === 'string' && profile.role.toLowerCase().includes('design')) {
          console.log('User has designer role based on pattern matching');
          setIsDesigner(true);
        } else {
          console.log('User does not have designer role');
          setIsDesigner(false);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        // Default to false (client menu) on error
        setIsDesigner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserRole();
  }, []);
  
  console.log('Sidebar component - isDesigner state:', isDesigner);

  return (
    <div className="flex flex-col h-full bg-indigo-900">
      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {isLoading ? (
          <div className="text-indigo-100 text-center py-4">Loading...</div>
        ) : isDesigner ? (
          // Designer Menu
          <div className="space-y-1">
            <div className="text-yellow-300 px-3 py-2 text-xs font-semibold">
              Designer Navigation
            </div>
            {designerMenuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  pathname === item.href
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                )}
              >
                <div className="text-indigo-300 group-hover:text-indigo-100 mr-3">
                  {item.icon}
                </div>
                {item.title}
              </Link>
            ))}
          </div>
        ) : (
          // Client Menu
          <div className="space-y-1">
            {clientMenuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  pathname === item.href
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                )}
              >
                <div className="text-indigo-300 group-hover:text-indigo-100 mr-3">
                  {item.icon}
                </div>
                {item.title}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
} 