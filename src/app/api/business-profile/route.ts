import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentBusinessProfile, 
  updateBusinessProfileForUser 
} from '@/lib/api/server-business-api';
import { requireAuth } from '@/lib/api/server-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/business-profile
 * 
 * Retrieves the current user's business profile
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get business profile
    const profile = await getCurrentBusinessProfile();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to retrieve business profile' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in business profile GET:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve business profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/business-profile
 * 
 * Updates the current user's business profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get update data from request
    const updates = await request.json();
    
    // Update business profile
    const updatedProfile = await updateBusinessProfileForUser(
      authResult.user.id,
      updates
    );
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error in business profile PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
} 