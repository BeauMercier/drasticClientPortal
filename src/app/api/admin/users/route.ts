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

// GET handler to fetch users with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Get user profiles with filters
    let query = adminClient.from('profiles').select('*');
    
    // Apply role filter if specified
    if (role) {
      query = query.eq('role', role);
    }
    
    // Apply search filter if specified
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Execute query
    const { data: profiles, error: queryError } = await query;
    
    if (queryError) {
      console.error('Error fetching users:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
}

// POST handler to create a new user or update an existing one
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { authorized, error } = await verifyAdminAccess();
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get request data
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Create admin client
    const adminClient = createAdminClient();
    
    // Check if user already exists by email
    const { data, error: searchError } = await adminClient.auth.admin.listUsers({
      perPage: 1
    });
    
    // Manually filter the users by email as the filters parameter isn't supported in the type
    const existingUser = data?.users.find(user => user.email === userData.email);
    
    let userId;
    
    // If user doesn't exist, create them
    if (!existingUser) {
      // Create new user in Auth
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password || null,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name || '',
          company: userData.company || ''
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      
      userId = newUser.user.id;
    } else {
      userId = existingUser.id;
    }
    
    // Update or create profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || 'client',
        company: userData.company,
        updated_at: new Date().toISOString()
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
  } catch (error) {
    console.error('Error in create/update user API:', error);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 