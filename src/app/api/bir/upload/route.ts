export const runtime = 'nodejs';     // 👈 forces Vercel to use a Node lambda

import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { z } from 'zod';
// import { Database } from '@/lib/database.types';
import { BirFileType } from '@/lib/types/bir'; // Import shared enum
import { createApiClient, requireAuth } from '@/lib/api/server-utils'; // Updated import

// Define the bucket name as a constant
const BUCKET_NAME = 'bir-files';

// No longer need InternalBirFileType, use BirFileType directly with Zod
// enum InternalBirFileType { ... }

const paramsSchema = z.object({
  birId: z.string().uuid({ message: 'Invalid BIR ID format.' }),
  fileType: z.nativeEnum(BirFileType, { // Use the shared BirFileType enum directly
    errorMap: () => ({ message: 'Invalid file type specified.' }),
  }),
});

// Helper function to get Supabase client
// const getSupabaseClient = () => {
//   // Assuming types are regenerated, no 'as any' needed here
//   return createRouteHandlerClient<Database>({ cookies });
// };

export async function POST(req: NextRequest) {
  // const supabase = getSupabaseClient(); // Old client instantiation
  const supabase = createApiClient(); // Use new client from server-utils

  // Validate Authentication
  const { authenticated, user, error: authError_ } = await requireAuth();
  if (!authenticated || !user) {
    return NextResponse.json({ error: authError_ || 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();

  const birId = form.get('birId') as string | null;
  const fileType = form.get('fileType') as string | null;
  const file = form.get('file') as File | null;

  // Refined validation
  if (!file) {
    return NextResponse.json(
      { error: 'File is required.' },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File cannot be empty.' }, { status: 400 });
  }
  // Optional: Add file size limit check here
  // const MAX_FILE_SIZE_MB = 20;
  // if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
  //   return NextResponse.json({ error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` }, { status: 400 });
  // }

  const parseResult = paramsSchema.safeParse({ birId, fileType });
  if (!parseResult.success) {
    // Provide more specific error feedback
    return NextResponse.json(
      { error: 'Invalid request parameters.', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validatedData = parseResult.data;
  const validatedBirId = validatedData.birId;
  // validatedData.fileType is now directly of type BirFileType
  const validatedDatabaseFileType = validatedData.fileType;

  // Construct storage path
  const fileExtension = file.name.split('.').pop();
  const storagePath = `${validatedBirId}/${randomUUID()}${fileExtension ? `.${fileExtension}` : ''}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false, // As specified in the plan
    });

  if (uploadError) {
    console.error('Supabase Storage Upload Error:', uploadError);
    // Consider more specific error handling based on uploadError.message or status
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Insert metadata into the database
  // Assuming types are regenerated, no 'as any' for supabase client or insert payload
  const { data: insertedFile, error: insertError } = await supabase
    .from('bir_file')
    .insert({
      bir_id: validatedBirId,
      file_type: validatedDatabaseFileType, // This is now correctly typed as BirFileType
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      // uploaded_at is set by default in DB schema
    })
    .select() // Select the inserted row
    .single(); // Expect exactly one row

  if (insertError) {
    console.error('Supabase DB Insert Error:', insertError);
    // Attempt to clean up the uploaded file if DB insert fails
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return NextResponse.json(
      { error: `Failed to record file metadata: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Return the inserted file metadata
  return NextResponse.json({ file: insertedFile }, { status: 201 });
} 