import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase' // Updated import

export async function POST (
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient<Database>({ cookies }) // Use Database type

  // Assuming you have a similar RPC function or direct table update for dismissing
  // For example, if you have an RPC 'mark_notification_dismissed':
  /*
  const { error } = await supabase.rpc('mark_notification_dismissed', {
    _nid: params.id
  })
  */

  // Or, if you update the status directly in the table:
  const { error } = await supabase
    .from('notifications')
    .update({ status: 'dismissed' })
    .eq('id', params.id)

  if (error) {
    console.error('[POST /dismiss] ', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
} 