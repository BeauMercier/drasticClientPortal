import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { Database } from '@/lib/database.types'; // Assuming generated types exist

// Define the bucket name as a constant
const BUCKET_NAME = 'bir-files';

// Define allowed file types using an enum for clarity and reuse
enum BirFileType {
  Logo = 'logo',
  StyleGuide = 'style_guide',
  Photo = 'photo',
  Certificate = 'certificate',
  Misc = 'misc',
}

const paramsSchema = z.object({
  birId: z.string().uuid({ message: 'Invalid BIR ID format.' }),
  fileType: z.nativeEnum(BirFileType, {
    errorMap: () => ({ message: 'Invalid file type specified.' }),
  }),
});

// Helper function to get Supabase client
const getSupabaseClient = () => {
  // TODO: Regenerate Supabase types (`npx supabase gen types typescript --project-id <your-project-id> --schema public > src/lib/database.types.ts`) to include the new 'bir_file' table.
  // Using 'as any' temporarily to bypass TypeScript errors until types are updated.
  return createRouteHandlerClient<Database>({ cookies });
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();

  // Validate Authentication (Assuming you have a helper like this)
  // const { user, error: authError } = await requireAuth(req); // Or similar check
  // if (authError || !user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const form = await req.formData();

  const birId = form.get('birId') as string | null;
  const fileType = form.get('fileType') as string | null; // Keep as string for initial Zod parse
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
  const validatedFileType = validatedData.fileType;

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
  // TODO: Remove 'as any' once Supabase types are regenerated to include 'bir_file'
  const { data: insertedFile, error: insertError } = await (supabase as any)
    .from('bir_file')
    .insert({
      bir_id: validatedBirId,
      file_type: validatedFileType, // Use the validated enum value
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      // uploaded_at is set by default in DB schema
    } as any) // Use 'as any' for the insert payload as well
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