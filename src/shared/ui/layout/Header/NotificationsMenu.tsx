'use client'
console.log('DEBUG: NotificationsMenu.tsx loaded'); // Temporary debug log

import { useState } from 'react'
import Link from 'next/link'
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import clsx from 'clsx'

/**
 * Component for displaying user notifications
 */
export default function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    error,
    isLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => setIsOpen(!isOpen)

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id)
    }
    setIsOpen(false) // Close dropdown on click
  }

  const handleMarkAllReadClick = async () => {
    await markAllAsRead()
  }

  return (
    <>
      <style jsx global>{`
        /* Targeting links within the notification dropdown in dark mode */
        /* This selector needs to be specific enough to target only these links */
        /* Using a hypothetical parent class for better scoping, adjust if needed */
        .dark div[class*="absolute right-0 mt-2"] div[class*="max-h-96"] a[class*="hover:bg-gray-100"]:hover {
          background-color: rgb(55 65 81 / 1) !important; /* Tailwind's gray-700 */
        }
      `}</style>
      <div className="relative">
        <button
          onClick={handleToggle}
          className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllReadClick}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {isLoading && <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading…</div>}
            {error && <div className="p-4 text-center text-red-500 dark:text-red-400">Error loading notifications.</div>}
            {!isLoading && !error && notifications?.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications yet.</div>
            )}
            <div className="max-h-96 overflow-y-auto">
              {notifications?.map((n) => {
                const date = new Date(n.created_at);
                const fmt = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                
                return (
                  <Link
                    key={n.id}
                    href={n.link || '#'}
                    onClick={() => handleNotificationClick(n)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b last:border-b-0',
                      'border-gray-100 dark:border-gray-700',
                      'hover:bg-gray-100 dark:hover:bg-gray-700/80',
                      n.status === 'unread'
                        ? 'bg-blue-50 dark:!bg-blue-800/70'
                        : 'bg-white dark:bg-gray-800'
                    )}
                  >
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{n.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{n.message}</p>
                      <time className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fmt}</time>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Temporary last-resort fix for dark mode hover
// TODO: Remove this once the global override for .dark .bg-gray-50 is fixed/removed
const GlobalNotificationsMenuDarkHoverFix = () => (
  <style jsx global>{`
    .dark .absolute[class*="NotificationsMenu__"] a.block[class*="hover:bg-gray-100"]:hover,
    .dark .absolute[class*="NotificationsMenu__"] a.block[class*="dark:hover:!bg-gray-700"]:hover {
      background-color: rgb(55 65 81 / 1) !important; /* Tailwind's gray-700 with full opacity */
    }
  `}</style>
); 