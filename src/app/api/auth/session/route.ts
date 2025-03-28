import { createApiClient } from '@/lib/api/server-utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Session endpoint for authenticated requests
 * Returns the current user session or an error
 */
export async function GET() {
  // Use our consolidated API client
  const supabase = createApiClient();
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error.message);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  
  return NextResponse.json({ session: data.session });
} 