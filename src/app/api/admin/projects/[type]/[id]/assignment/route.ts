import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

interface Params {
  type: string;
  id: string;
}

// Define interfaces for our data
interface Designer {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

interface Assigner {
  id: string;
  email?: string;
  full_name?: string;
}

interface Assignment {
  id: string;
  assigned_at: string;
  designer_id: string;
  assigned_by_id: string;
  designer?: Designer;
  assigned_by?: Assigner;
}

// Verify admin or designer access
async function verifyAccess() {
  try {
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required', user: null };
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { authorized: false, error: 'Failed to get user profile', user: null };
    }
    
    // Check if user is an admin or designer
    if (profile.role !== 'admin' && profile.role !== 'designer') {
      return { authorized: false, error: 'Unauthorized access', user: null };
    }
    
    return { authorized: true, error: null, user };
  } catch (error) {
    console.error('Error verifying access:', error);
    return { authorized: false, error: 'Server error during authorization', user: null };
  }
}

// Helper to get service client
function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return { supabase: null, error: 'Missing environment variables' };
  }
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return { supabase, error: null };
}

// GET current assignment
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    // Verify access
    const { authorized, error: authError } = await verifyAccess();
    
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }
    
    const { supabase, error: clientError } = getServiceClient();
    
    if (!supabase) {
      return NextResponse.json({ error: clientError }, { status: 500 });
    }
    
    const projectType = params.type;
    const projectId = params.id;
    
    // Get the current assignment using standard JOIN instead of foreign key syntax
    const { data: assignments, error } = await supabase
      .from('project_assignments')
      .select('id, assigned_at, designer_id, assigned_by_id')
      .eq('project_type', projectType)
      .eq('project_id', projectId)
      .order('assigned_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!assignments || assignments.length === 0) {
      // No assignment found - this is a valid state
      return NextResponse.json({ assignment: null });
    }
    
    const assignment = assignments[0] as Assignment;
    
    // Now fetch the designer's information separately
    if (assignment.designer_id) {
      const { data: designer, error: designerError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', assignment.designer_id)
        .single();
        
      if (designerError) {
        console.error('Error fetching designer details:', designerError);
        // Don't fail the request, just return what we have
      } else if (designer) {
        assignment.designer = designer as Designer;
      }
    }
    
    // Fetch the assigner's information separately
    if (assignment.assigned_by_id) {
      const { data: assigner, error: assignerError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', assignment.assigned_by_id)
        .single();
        
      if (assignerError) {
        console.error('Error fetching assigner details:', assignerError);
        // Don't fail the request, just return what we have
      } else if (assigner) {
        assignment.assigned_by = assigner as Assigner;
      }
    }
    
    return NextResponse.json({ assignment });
    
  } catch (error) {
    console.error('Error in assignment GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST create a new assignment
export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    // Verify access
    const { authorized, error: authError, user } = await verifyAccess();
    
    if (!authorized || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }
    
    const { supabase, error: clientError } = getServiceClient();
    
    if (!supabase) {
      return NextResponse.json({ error: clientError }, { status: 500 });
    }
    
    const projectType = params.type;
    const projectId = params.id;
    
    // Parse request body
    const body = await request.json();
    
    if (!body.designerId) {
      return NextResponse.json({ error: 'Designer ID is required' }, { status: 400 });
    }
    
    // First, check if the designer exists
    const { data: designer, error: designerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', body.designerId)
      .single();
    
    if (designerError || !designer) {
      return NextResponse.json({ error: 'Designer not found' }, { status: 404 });
    }
    
    // Verify the user is actually a designer - check if "design" appears in role
    const designerRole = designer.role?.toLowerCase() || '';
    if (!designerRole.includes('design') && designerRole !== 'admin') {
      return NextResponse.json(
        { error: `Selected user is not a designer (role: ${designer.role})` },
        { status: 400 }
      );
    }
    
    // Create a new assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('project_assignments')
      .upsert({
        project_type: projectType,
        project_id: projectId,
        designer_id: body.designerId,
        assigned_by_id: user.id,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'project_type,project_id'
      })
      .select()
      .single();
    
    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ assignment });
    
  } catch (error) {
    console.error('Error in assignment POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE an assignment
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    // Verify access
    const { authorized, error: authError } = await verifyAccess();
    
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }
    
    const { supabase, error: clientError } = getServiceClient();
    
    if (!supabase) {
      return NextResponse.json({ error: clientError }, { status: 500 });
    }
    
    const projectType = params.type;
    const projectId = params.id;
    
    // Delete all assignments for this project (there should only be one active)
    const { error: deleteError } = await supabase
      .from('project_assignments')
      .delete()
      .eq('project_type', projectType)
      .eq('project_id', projectId);
    
    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in assignment DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 