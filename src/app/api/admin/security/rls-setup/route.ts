import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';
import logger from '@/lib/logger';

const log = logger.forModule('RLS-Setup');

// Function to create a service role client
function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    throw new Error('Service role key is required for admin operations');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Helper function to verify admin access
async function verifyAdminAccess() {
  try {
    // Create a Supabase client configured to use cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the user using getUser() for better security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
    
    // Get the user's profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { authorized: false, error: 'Failed to get user profile' };
    }
    
    // Check if user is an admin
    if (profile.role !== 'admin') {
      return { authorized: false, error: 'Unauthorized: Admin access required' };
    }
    
    return { authorized: true, user };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: false, error: 'Server error during authorization' };
  }
}

/**
 * Setup row-level security policies for database tables
 */
export async function POST() {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json({ error }, { status: 401 });
    }
    
    // Initialize Supabase client with service role key
    const supabase = createServiceRoleClient();
    
    // Get the migration file content
    const migrationFilePath = path.join(process.cwd(), 'src/lib/supabase/migrations/20250328000000_implement_rls_policies.sql');
    
    try {
      const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
      
      // Execute the migration file
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql: sqlContent });
      
      if (migrationError) {
        console.error('Error executing RLS migration:', migrationError);
        return NextResponse.json(
          { error: `Error setting up RLS: ${migrationError.message}` }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Row-level security policies created successfully using the migration file' 
      });
    } catch (fsError) {
      console.error('Error reading migration file:', fsError);
      
      // Fallback to the previous implementation if the file can't be read
      console.warn('Falling back to direct SQL operations');
      
      // SQL operations for setting up RLS (legacy approach)
      const operations = [
        // Enable RLS on designer_tasks table
        `ALTER TABLE designer_tasks ENABLE ROW LEVEL SECURITY;`,
        
        // Designer can only see their own tasks
        `CREATE POLICY designer_tasks_select ON designer_tasks
         FOR SELECT USING (designer_id = auth.uid() OR 
                           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role ILIKE '%admin%'));`,
                          
        // Designer can only update their own tasks
        `CREATE POLICY designer_tasks_update ON designer_tasks
         FOR UPDATE USING (designer_id = auth.uid() OR 
                          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role ILIKE '%admin%'));`,
        
        // Check if project_assignments table exists, then set RLS
        `DO $$
         BEGIN
           IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_assignments') THEN
             EXECUTE 'ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;';
             
             EXECUTE 'CREATE POLICY project_assignments_select ON project_assignments
                     FOR SELECT USING (designer_id = auth.uid() OR 
                                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role ILIKE ''%admin%''));';
           END IF;
         END
         $$;`
      ];
      
      // Execute SQL operations sequentially
      for (const sql of operations) {
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
          console.error('Error executing SQL:', error);
          return NextResponse.json(
            { error: `Error setting up RLS: ${error.message}` }, 
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json({ success: true, message: 'Row-level security policies created successfully using legacy approach' });
    }
  } catch (error: any) {
    console.error('Error setting up RLS:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 