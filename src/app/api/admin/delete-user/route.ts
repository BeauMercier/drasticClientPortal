import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

// Check if a user has admin role
async function verifyAdminAccess() {
  try {
    // Create a Supabase client using our consolidated API
    const supabase = createApiClient();
    
    // Get the current user
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
      return { authorized: false, error: 'Could not verify user role' };
    }
    
    if (profile.role !== 'admin') {
      return { authorized: false, error: 'Admin access required' };
    }
    
    return { authorized: true, user };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { authorized: false, error: 'Error verifying admin access' };
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error, user } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get user ID from URL
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing user ID' },
        { status: 400 }
      );
    }
    
    // Check if user is trying to delete themselves
    if (user?.id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Create admin client to delete user
    const adminClient = createAdminClient();
    
    // Delete the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 