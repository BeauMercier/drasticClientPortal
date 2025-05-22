import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export async function POST (req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const { error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    console.error('[POST /read-all] ', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 