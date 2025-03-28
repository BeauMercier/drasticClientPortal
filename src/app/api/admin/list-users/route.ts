import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Use admin client to fetch users
    const adminClient = createAdminClient();
    
    // Get all users
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }
    
    // Combine auth users with profile data
    const users = authUsers.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id) || {};
      
      return {
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        role: profile.role || 'unknown',
        fullName: profile.full_name || user.user_metadata?.full_name || '',
        company: profile.company || user.user_metadata?.company || ''
      };
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in list users API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 