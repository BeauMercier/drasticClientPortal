import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth';
import Image from 'next/image';

type UserProfileMenuProps = {
  userAvatarUrl?: string | null;
  onLogout: () => Promise<void>;
};

/**
 * Component for user profile dropdown menu
 */
export default function UserProfileMenu({ userAvatarUrl, onLogout }: UserProfileMenuProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  
  const userInitial = (session?.user?.email?.charAt(0) || 'U').toUpperCase();

  const handleLogout = async () => {
    await onLogout();
    router.push('/login');
  };
  
  return (
    <div className="relative">
      <button
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        onClick={() => setShowProfile(!showProfile)}
        aria-label="User profile"
      >
        {userAvatarUrl ? (
          <div className="relative h-10 w-10 rounded-full overflow-hidden shadow-md">
            <Image 
              src={userAvatarUrl} 
              alt="Profile" 
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center uppercase shadow-md">
            {userInitial}
          </div>
        )}
      </button>

      {showProfile && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {userAvatarUrl ? (
                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                    <Image 
                      src={userAvatarUrl} 
                      alt="Profile" 
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center uppercase">
                    {userInitial}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{session?.user?.email || 'User'}</p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Link href="/my-info" className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors">
              <UserCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
              My Profile
            </Link>
            <button 
              className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 2h10v10H4V5zm4.293 2.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L8.586 10 8.293 9.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 