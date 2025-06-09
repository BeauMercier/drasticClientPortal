import { createAdminClient } from '@/lib/api/server';
import { createApiClient } from '@/lib/api/server-utils';
import { NextRequest, NextResponse } from 'next/server';
import { BirStatus, isBirStatus } from '@/lib/types/bir';
import { UserRole } from '@/lib/types/user';

type RouteContext = {
  params: {
    birId: string;
  };
};

// Helper to verify admin access
async function verifyAdminAccess() {
  try {
    const supabase = createApiClient(); // Uses user's cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { authorized: false, error: 'Unauthorized' };
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return { authorized: false, error: 'Could not verify user role' };
    }
    if (profile.role !== 'admin') {
      return { authorized: false, error: 'Forbidden: Admins only' };
    }
    return { authorized: true, user };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: false, error: 'Error verifying admin access' };
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { authorized, error: authError } = await verifyAdminAccess();
  if (!authorized) {
    return new NextResponse(JSON.stringify({ error: authError }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { birId } = params;
  let newStatus: BirStatus;

  try {
    const body = await req.json();
    if (!isBirStatus(body.status)) {
        throw new Error('Invalid status value provided.');
    }
    newStatus = body.status;
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad Request: Invalid JSON body or status field.';
    return new NextResponse(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use the admin client with service_role to update the database
  const adminSupabase = createAdminClient();
  
  const updatePayload: { status: BirStatus; submitted_at?: string | null } = { status: newStatus };
  
  if (newStatus === 'pending') {
    // When reverting to pending, we can clear the submission date to allow resubmission.
    updatePayload.submitted_at = null; 
  }

  const { data, error: updateError } = await adminSupabase
    .from('business_information_requests')
    .update(updatePayload)
    .eq('id', birId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating BIR status:', updateError);
    return new NextResponse(JSON.stringify({ error: 'Failed to update BIR status', details: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json(data);
} 