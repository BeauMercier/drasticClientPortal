import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hasPublicUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Only return a sanitized version of the environment info
    // Do not include the actual environment variables for security reasons
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: hasPublicUrl 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 8)}...` 
          : null,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey
          ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8)}...` 
          : null,
        SUPABASE_SERVICE_ROLE_KEY: hasServiceKey
          ? `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 8)}...` 
          : null,
      },
      status: {
        ready: hasPublicUrl && hasAnonKey && hasServiceKey,
        missing: [
          !hasPublicUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
          !hasAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
          !hasServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
        ].filter(Boolean),
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error checking environment variables',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
} 