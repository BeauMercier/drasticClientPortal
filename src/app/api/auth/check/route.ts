import { requireAuth } from '@/lib/api/server-utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAuth();
    
    if (!auth.authenticated) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Not authenticated',
        error: auth.error
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: auth.user
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      message: 'Error checking authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 