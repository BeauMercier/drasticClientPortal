import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

// Define the expected shape of the response item based on user_files table
interface UserFileResponse {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  project_type: string | null;
  project_id: string | null;
  uploaded_at: string;
  // Add other fields if needed, e.g., joining with profiles to get uploader name
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // 1. Authenticate the user
    const authResult = await requireAuth();
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get projectId from route parameters
    const { projectId } = params;
    if (!projectId) {
       return NextResponse.json(
         { error: 'Project ID is required.' },
         { status: 400 }
       );
    }

    // 3. Create Supabase client (respects RLS)
    const supabase = createApiClient();

    // 4. Query user_files table
    // RLS policies on user_files should automatically filter
    // what the current user is allowed to see for this projectId.
    const { data, error } = await supabase
      .from('user_files')
      .select('*') // Select all columns for now
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false }); // Show newest files first

    if (error) {
      console.error('Error fetching project user files:', error);
      return NextResponse.json(
        { error: `Failed to fetch files for project: ${error.message}` },
        { status: 500 }
      );
    }

    // 5. Return the fetched files
    return NextResponse.json(data as UserFileResponse[] || []);

  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/user-files:', error);
    return NextResponse.json(
      { error: 'Server error fetching project files.' },
      { status: 500 }
    );
  }
} 