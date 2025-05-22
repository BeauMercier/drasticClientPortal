import useSWR from 'swr'
import { Notification } from '@/app/api/notifications/types'

async function fetcher(url: string): Promise<Notification[]> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/notifications?from=0&to=49',
    fetcher,
    { refreshInterval: 60_000 }    // poll once per minute
  )

  return {
    notifications: data ?? [],
    unread: (data ?? []).filter(n => n.status === 'unread'),
    error,
    isLoading,
    mutate
  }
} 