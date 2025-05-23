import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic' // Ensures the route is not cached

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const rangeFrom = Number(url.searchParams.get('from') || 0)
  const rangeTo   = Number(url.searchParams.get('to')   || 19)   // default 20 rows

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id) // Ensure only fetching for the authenticated user
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo)

  if (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  // Consider returning count for pagination UI
  return NextResponse.json({ data, count })
} 