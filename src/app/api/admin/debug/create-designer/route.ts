import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/api/server-utils';
import { createAdminClient } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

type RoleFormat = 'both' | 'metadata' | 'profile' | 'string';

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
    
    const data = await request.json();
    const { email, password, fullName, roleFormat = 'both' } = data;
    
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create admin client
    const adminClient = createAdminClient();
    
    console.log(`Creating designer with role format: ${roleFormat}`);
    
    // Step 1: Create user based on the role format
    let userData;
    let userError;
    
    // Store role based on specified format
    if (roleFormat === 'metadata' || roleFormat === 'both' || roleFormat === 'string') {
      // Create user with role in app_metadata
      const appMetadata = roleFormat === 'string' 
        ? { role: JSON.stringify('designer') }  // Store as properly typed object
        : { role: 'designer' };                 // Store as object (normal)
        
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
        app_metadata: appMetadata,
      });
      
      userData = data;
      userError = error;
    } else {
      // Create user without role in metadata
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });
      
      userData = data;
      userError = error;
    }
    
    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }
    
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    // Step 2: If using profile table or both, add to profiles table
    let profileData = null;
    let profileError = null;
    
    if (roleFormat === 'profile' || roleFormat === 'both') {
      const { data, error } = await adminClient
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: email,
          full_name: fullName,
          role: 'designer',
          updated_at: new Date().toISOString(),
        })
        .select();
      
      profileData = data;
      profileError = error;
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue anyway since we created the user
      }
    }
    
    // Step 3: Verify the user was created
    const { data: verifiedUser, error: verifyError } = await adminClient.auth.admin.getUserById(
      userData.user.id
    );
    
    if (verifyError) {
      console.error('Error verifying user:', verifyError);
    }
    
    return NextResponse.json({
      success: true,
      user: userData.user,
      profile: profileData?.[0] || null,
      verifiedUser: verifiedUser?.user || null,
      roleFormat,
    });
  } catch (error) {
    console.error('Error in debug create-designer:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
} 