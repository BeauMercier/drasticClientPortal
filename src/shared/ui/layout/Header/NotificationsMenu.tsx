'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import clsx from 'clsx';

/**
 * Component for displaying user notifications.
 * This component now uses Tailwind CSS dark mode variants directly for styling
 * and avoids global CSS overrides for better maintainability.
 */
export default function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    error,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    setIsOpen(false); // Close dropdown on click
  };

  const handleMarkAllReadClick = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none dark:hover:text-gray-200"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-60">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllReadClick}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {isLoading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              Error loading notifications.
            </div>
          )}
          {!isLoading && !error && notifications?.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No notifications yet.
            </div>
          )}
          <div className="max-h-96 overflow-y-auto">
            {notifications?.map(n => {
              const date = new Date(n.created_at);
              const fmt = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              const isRead = n.status === 'read';

              return (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => handleNotificationClick(n)}
                  className={clsx(
                    'flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors duration-150 focus:outline-none',
                    'border-gray-200 dark:border-gray-700',

                    isRead
                      ? /* READ */
                        'bg-transparent text-gray-500 hover:bg-gray-100/70 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/40'
                      : /* UNREAD */
                        'bg-blue-50 text-gray-900 hover:bg-blue-100 force-unread-bg'
                  )}
                >
                  <div>
                    <h4 className="font-medium">
                      {n.title}
                    </h4>
                    <p className="text-sm break-words">
                      {n.message}
                    </p>
                    <time className="text-xs mt-1">
                      {fmt}
                    </time>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
