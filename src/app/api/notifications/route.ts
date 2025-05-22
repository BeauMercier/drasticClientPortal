import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { Notification } from './types'

export const dynamic = 'force-dynamic'   // avoids cache while polling

export async function GET (req: Request) {
  // Parse pagination query params
  const { searchParams } = new URL(req.url)
  const from = Number(searchParams.get('from') ?? 0)
  const to   = Number(searchParams.get('to')   ?? 19)   // default 20

  const supabase = createRouteHandlerClient<Database>({ cookies }) // Use Database type

  const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

  if (error) {
    console.error('[GET /api/notifications] ', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data as Notification[])
} 