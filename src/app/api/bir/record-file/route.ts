export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BirFileType } from '@/lib/types/bir';
import { requireAuth } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

export async function POST(req: NextRequest) {
  const { authenticated, user, error: authError_ } = await requireAuth();
  if (!authenticated || !user) {
    return NextResponse.json({ error: authError_ || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parse = z.object({
      birId:      z.string().uuid({ message: "Invalid BIR ID" }),
      objectKey:  z.string().min(1, { message: "Object key cannot be empty" }),
      size:       z.number().int().positive({ message: "Size must be a positive integer" }),
      mime:       z.string().min(1, { message: "MIME type cannot be empty" }),
      originalName: z.string().min(1, { message: "Original name cannot be empty" }),
      fileType:   z.nativeEnum(BirFileType, { message: "Invalid file type" }),
    }).safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parse.error.flatten().fieldErrors }, { status: 400 });
    }

    const { birId, objectKey, size, mime, originalName, fileType } = parse.data;

    // Get the centralized admin client
    const supabaseAdmin = createAdminClient();

    // Insert metadata into the bir_file table
    const { data: insertedFile, error } = await supabaseAdmin
        .from('bir_file') // Your BIR metadata table
        .insert({
          bir_id: birId,
          storage_path: objectKey, // This is the full path in the bucket
          mime_type: mime,
          size_bytes: size,
          original_name: originalName,
          file_type: fileType,
          // file_type from BirFileType enum would need to be passed from client if still desired
          // or determined here based on mime type if necessary.
          // For now, assuming these are the core fields from the plan.
        })
        .select()
        .single();

    if (error) {
      console.error('[record-file] Supabase DB insert error:', error);
      // Note: We don't attempt to delete the already uploaded storage object here
      // because the upload was direct from client to Supabase. If this step fails,
      // there might be an orphaned file in storage. This could be handled by a cleanup job later.
      return NextResponse.json({ error: 'Failed to record file metadata', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, file: insertedFile });

  } catch (e: any) {
    console.error('[record-file] Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred.', details: e.message }, { status: 500 });
  }
} 