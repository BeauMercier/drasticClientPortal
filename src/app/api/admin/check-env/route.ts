import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasPublicUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Don't return the actual keys for security reasons, just whether they exist
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasPublicUrl,
      hasAnonKey,
      hasServiceKey,
      // Include first few characters of the service key (masked) for verification
      serviceKeyPrefix: hasServiceKey
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)}...` 
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error checking environment: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 