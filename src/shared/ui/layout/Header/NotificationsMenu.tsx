import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

/**
 * Component for displaying user notifications
 */
export default function NotificationsMenu() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          3
        </span>
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">3 new</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New message from support</p>
                  <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Your invoice is ready</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-2 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Project status updated</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
            <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 