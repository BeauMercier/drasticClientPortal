'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useNotifications, Notification } from '@/hooks/useNotifications'

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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-60">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllReadClick}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {isLoading && <div className="p-4 text-center text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-center text-red-500">Error loading notifications.</div>}
          {!isLoading && !error && notifications?.length === 0 && (
            <div className="p-4 text-center text-gray-500">No notifications yet.</div>
          )}
          <div className="max-h-96 overflow-y-auto">
            {notifications?.map((n) => (
              <Link
                key={n.id}
                href={n.link || '#'}
                onClick={() => handleNotificationClick(n)}
                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 
                  ${n.status === 'unread' ? 'font-semibold bg-blue-50' : ''}
                  ${n.type === 'action_required' && n.status === 'unread' ? 'border-l-4 border-yellow-400' : ''}
                  ${n.type === 'success' && n.status === 'unread' ? 'border-l-4 border-green-400' : ''}
                  ${n.type === 'warning' && n.status === 'unread' ? 'border-l-4 border-red-400' : ''}
                `}
              >
                <h4 className="text-sm text-gray-800">{n.title}</h4>
                <p className="text-xs text-gray-600 break-words">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 