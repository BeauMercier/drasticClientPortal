import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the service role key and URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing environment variables' },
        { status: 500 }
      );
    }
    
    // Create admin client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Sign up user with the default Supabase auth (not using admin API)
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { 
          full_name: userData.full_name,
          role: 'designer' // Always set role to designer for this endpoint
        }
      }
    });
    
    if (authError) {
      console.error('Error creating user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }
    
    // Make sure the user was created
    if (!authUser?.user) {
      return NextResponse.json({ 
        error: 'User creation failed without error' 
      }, { status: 500 });
    }
    
    // Add or update the profile with the designer role - important for role detection
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: 'designer',
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      // We report but don't fail here since the auth user was created successfully
    }
    
    // Double-check with listUsers to ensure user has proper metadata
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(authUser.user.id);
      
      if (userError) {
        console.error('Error getting user after creation:', userError);
      } else {
        console.log('Created user metadata:', userData?.user?.app_metadata);
        
        // If app_metadata doesn't have role, update it
        if (!userData?.user?.app_metadata?.role) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            authUser.user.id,
            { app_metadata: { role: 'designer' } }
          );
          
          if (updateError) {
            console.error('Error updating user metadata:', updateError);
          }
        }
      }
    } catch (metadataError) {
      console.error('Error in metadata verification:', metadataError);
    }
    
    return NextResponse.json({
      success: true,
      user: authUser.user,
      message: 'Designer account created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering designer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register designer' },
      { status: 500 }
    );
  }
} 