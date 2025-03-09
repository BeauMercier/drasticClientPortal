'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-800">DrasticDigital</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <p className="text-sm font-medium">New message from support</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
                    <p className="text-sm font-medium">Your invoice is ready</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                  <div className="p-4 hover:bg-gray-50">
                    <p className="text-sm font-medium">Project status updated</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
                <div className="p-2 text-center border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center uppercase">
                {session?.user?.name?.slice(0, 1) || session?.user?.email?.slice(0, 1) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{session?.user?.email || ''}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email || ''}</p>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md">
                    Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md">
                    Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md text-red-600">
                    Logout
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