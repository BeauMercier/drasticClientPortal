import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { nextCookies } from '@/lib/supabase/cookieAdapter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: nextCookies() }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The RLS policy on public.notifications and the DB function mark_all_notifications_read should handle this.
  const { error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    console.error('Error marking all notifications read:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
} 