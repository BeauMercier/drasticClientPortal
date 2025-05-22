export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  link: string | null
  type: 'info' | 'warning' | 'action_required' | 'success'
  status: 'unread' | 'read' | 'dismissed'
  trigger_event: string | null
  created_at: string
  read_at: string | null
} 