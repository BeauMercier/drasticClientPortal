import useSWR, { KeyedMutator } from 'swr'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect } from 'react'
import { useAuth } from '@/features/auth'

// Define your Notification type based on the table structure
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  type: 'info' | 'warning' | 'action_required' | 'success';
  status: 'unread' | 'read' | 'dismissed';
  trigger_event?: string | null;
  created_at: string;
  read_at?: string | null;
}

interface UseNotificationsReturn {
  notifications: Notification[] | undefined;
  unreadCount: number;
  error: any;
  isLoading: boolean;
  mutateNotifications: KeyedMutator<{ data: Notification[], count: number }>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function useNotifications(): UseNotificationsReturn {
  const supabase = createClientComponentClient()
  const { user } = useAuth() // Get user from AuthContext

  const { data, error, isLoading, mutate } = useSWR<{ data: Notification[], count: number }>(
    user ? `/api/notifications?from=0&to=49` : null, // Only fetch if user is available
    fetcher,
    {
      refreshInterval: 60_000, // Poll once a minute
      // revalidateOnFocus: true, // Optional: revalidate on window focus
    }
  )

  const notifications = data?.data
  const unreadCount = notifications?.filter(n => n.status === 'unread').length ?? 0

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      // Optimistically update local state
      mutate(current => {
        if (!current) return current
        return {
          ...current,
          data: current.data.map(n => 
            n.id === notificationId 
              ? { ...n, status: 'read' as const, read_at: new Date().toISOString() } 
              : n
          )
        }
      }, false)
    } catch (e) {
      console.error("Failed to mark notification as read", e)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      // Optimistically update local state
      mutate(current => {
        if (!current) return current
        return {
          ...current,
          data: current.data.map(n => ({ 
            ...n, 
            status: 'read' as const,
            read_at: n.status === 'unread' ? new Date().toISOString() : n.read_at
          }))
        }
      }, false)
    } catch (e) {
      console.error("Failed to mark all notifications as read", e)
    }
  }

  // Optional: Realtime listener
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`notifications_user_${user.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Mutate SWR data to include the new notification
          mutate((currentData) => {
            if (!currentData) return currentData;
            // Avoid adding if already present (e.g. from polling race condition)
            if (currentData.data.find(n => n.id === payload.new.id)) {
                return currentData;
            }
            return {
              data: [payload.new, ...currentData.data].sort(
                (a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ),
              count: currentData.count + 1
            };
          }, false); // false means don't revalidate immediately
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Subscribed to notifications channel!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime Channel Error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.warn('Realtime Channel Timed Out');
        }
      });

    // Cleanup function to remove the channel subscription when the component unmounts or user changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, mutate]); // Add user, supabase, mutate to dependency array

  return {
    notifications,
    unreadCount,
    error,
    isLoading,
    mutateNotifications: mutate,
    markAsRead,
    markAllAsRead,
  }
} 