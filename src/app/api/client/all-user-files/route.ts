import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AllUserFileResponse {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  project_id: string | null;
  project_type: string | null;
  is_folder: boolean;
  created_at: string;
}

export async function GET() {
  // ── pull bearer token sent by the client ─────────────────────────
  const authHeader = headers().get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── create client WITHOUT cookies ────────────────────────────────
  const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Validate token → get user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    console.error('[all-user-files] auth error →', userErr?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── fetch rows ───────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('user_files')
    .select(
      `id,
       user_id,
       file_path,
       file_name,
       file_size,
       file_type,
       project_id,
       project_type,
       is_folder,
       uploaded_at`
    )
    .eq('user_id', user.id);

  if (error) {
    console.error('[all-user-files] DB error →', error);
    return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
  }

  // Safely map data to AllUserFileResponse[], ensuring all fields comply with the interface
  const payload: AllUserFileResponse[] = (data ?? []).map((file) => {
    // The user_id from `file` object should be string as per your table schema after .eq filter,
    // and `AllUserFileResponse` expects string. If there was a null possibility from DB types,
    // it would need handling, but select() post .eq('user_id', user.id) should ensure it.
    const userId = file.user_id;
    if (!userId) {
      // This case should ideally not happen if RLS and .eq filter work as expected.
      // Log a warning if it does, and potentially filter out or use a fallback.
      console.warn('[all-user-files] File found with null user_id after filtering, using request user.id:', file.id);
      // Fallback to the user.id from the authenticated user. This makes the type checker happy.
      return {
        ...file,
        user_id: user.id, // Fallback to the current user's ID from token
        created_at: file.uploaded_at || new Date().toISOString(),
      } as AllUserFileResponse; // Ensure all fields of AllUserFileResponse are present
    }
    return {
      ...file,
      user_id: userId, // user_id is confirmed string here
      created_at: file.uploaded_at || new Date().toISOString(), // Ensure created_at is always a string
    } as AllUserFileResponse; // Ensure all fields of AllUserFileResponse are present
  });

  return NextResponse.json(payload);
} 