import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  if (!params.id) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
  }
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Important: Ensure the user calling this owns the notification.
  // The RLS policy on public.notifications and the DB function mark_notification_read should handle this.
  const { error } = await supabase.rpc('mark_notification_read', { _nid: params.id })

  if (error) {
    console.error('Error marking notification read:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
} 