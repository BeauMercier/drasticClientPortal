import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

// Helper to verify admin access
async function verifyAdminAccess() {
  try {
    // Create API client for authentication
    const supabase = createApiClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { authorized: false, error: 'Authentication required' };
    }
    
    // Check if user has admin role
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

// GET handler to fetch a single user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Get user details from Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Error fetching auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
    
    if (!authUser?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user profile from database
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
    
    // Combine auth and profile data
    const userData = {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      last_sign_in: authUser.user.last_sign_in_at,
      // Add profile data if it exists
      ...(profile || {}),
      // Add user metadata if available
      full_name: profile?.full_name || authUser.user.user_metadata?.full_name || '',
      company: profile?.company || authUser.user.user_metadata?.company || ''
    };
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error in get user API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
}

// PUT handler to update a user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get update data
    const updates = await request.json();
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Update user metadata if provided
    if (updates.email || updates.full_name) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        email: updates.email,
        user_metadata: {
          full_name: updates.full_name
        }
      });
      
      if (authError) {
        console.error('Error updating auth user:', authError);
        return NextResponse.json(
          { error: 'Failed to update user auth data' },
          { status: 500 }
        );
      }
    }
    
    // Update profile if provided
    if (Object.keys(updates).length > 0) {
      // Remove auth-only fields
      const { email: _email, password: _password, ...profileUpdates } = updates;
      
      // Add updated timestamp
      profileUpdates.updated_at = new Date().toISOString();
      
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: userId,
          ...profileUpdates
        })
        .select()
        .single();
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(profile);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update user API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify admin access
    const { authorized, error, user } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent deleting self
    if (user?.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Delete the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 