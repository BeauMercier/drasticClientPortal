'use client'

import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'          // or any icon lib

export default function NotificationsMenu() {
  const { notifications, unread, isLoading, mutate } = useNotifications()
  const router = useRouter()

  const markRead = async (id: string, link?: string | null) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    mutate()                                  // refresh SWR cache
    if (link) router.push(link)
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    mutate()
  }

  return (
    <div className="relative">
      {/* Bell icon */}
      <button className="relative p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center
                           justify-center rounded-full bg-red-600 text-[10px] text-white">
            {unread.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 rounded border bg-white shadow-lg
                      dark:border-neutral-700 dark:bg-neutral-900">
        <div className="max-h-96 overflow-y-auto">
          {isLoading && <p className="p-4">Loading…</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="p-4 text-sm text-neutral-500">No notifications</p>
          )}

          {notifications.map(n => (
            <button
              key={n.id}
              className={`flex w-full flex-col items-start gap-1 p-4 text-left
                          hover:bg-neutral-50 dark:hover:bg-neutral-800
                          ${n.status === 'unread' ? 'font-semibold' : ''}`}
              onClick={() => markRead(n.id, n.link ?? undefined)}
            >
              <span>
                {n.type === 'action_required' && '⚠️ '}
                {n.title}
              </span>
              <span className="text-xs text-neutral-500">{n.message}</span>
            </button>
          ))}
        </div>

        {unread.length > 0 && (
          <button
            className="w-full border-t p-2 text-center text-sm hover:bg-neutral-50
                       dark:border-neutral-700 dark:hover:bg-neutral-800"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>
    </div>
  )
} 