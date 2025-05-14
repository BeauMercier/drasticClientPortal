export const runtime = 'nodejs';           // tiny JSON body → Node λ is fine
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { randomUUID } from 'crypto'; // Import for crypto.randomUUID in Node.js

// Initialize Supabase client with service role key
// Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your Vercel environment variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // service role required for upload URLs
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = z.object({
      birId:     z.string().uuid({ message: "Invalid BIR ID" }),
      filename:  z.string().min(1, { message: "Filename cannot be empty" }),
      mime:      z.string().min(1, { message: "MIME type cannot be empty" }),
    }).safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parse.error.flatten().fieldErrors }, { status: 400 });
    }

    const { birId, filename, mime } = parse.data;
    
    // Use crypto.randomUUID for Node.js environments
    const objectKey = `${birId}/${randomUUID()}-${filename}`;

    const { data, error } =
      await supabaseAdmin
        .storage
        .from('bir-files') // Your BIR files bucket
        .createSignedUploadUrl(objectKey, 60 * 10, { // 10 minute expiry
          contentType: mime 
        });

    if (error) {
      console.error('[create-upload-url] Supabase storage error:', error);
      return NextResponse.json({ error: 'Failed to create signed upload URL', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl: data.signedUrl, objectKey });

  } catch (e: any) {
    console.error('[create-upload-url] Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: e.message }, { status: 500 });
  }
} 