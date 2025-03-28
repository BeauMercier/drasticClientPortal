/**
 * Server Business API Module
 * 
 * This module provides server-side API functions for interacting with business profiles.
 * It's designed to be used in API routes and server components.
 */

import { createApiClient } from '@/lib/api/server-utils';
import { createServiceRoleClient } from './server';
import { BusinessProfile } from '@/lib/types/user';

/**
 * Get a business profile by user ID
 * 
 * @param userId The user ID to get the profile for
 * @returns The business profile or null if not found
 */
export async function getBusinessProfileById(userId: string): Promise<BusinessProfile | null> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "No rows returned"
    console.error('Error fetching business profile:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create a business profile for a specific user
 * 
 * @param userId The user ID to create the profile for
 * @param profile The profile data
 * @returns The created business profile
 */
export async function createBusinessProfileForUser(
  userId: string, 
  profile: Partial<BusinessProfile>
): Promise<BusinessProfile> {
  const supabase = createServiceRoleClient();
  
  // Add user ID and timestamps
  const profileData = {
    id: userId,
    ...profile,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('business_profiles')
    .insert(profileData)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating business profile:', error);
    throw error;
  }
  
  return data;
}

/**
 * Update a business profile for a specific user
 * 
 * @param userId The user ID to update the profile for
 * @param updates The profile updates
 * @returns The updated business profile
 */
export async function updateBusinessProfileForUser(
  userId: string,
  updates: Partial<BusinessProfile>
): Promise<BusinessProfile> {
  const supabase = createServiceRoleClient();
  
  // Add updated timestamp
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('business_profiles')
    .update(updatesWithTimestamp)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating business profile:', error);
    throw error;
  }
  
  return data;
}

/**
 * Delete a business profile
 * 
 * @param userId The user ID of the profile to delete
 * @returns True if successful
 */
export async function deleteBusinessProfile(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  const { error } = await supabase
    .from('business_profiles')
    .delete()
    .eq('id', userId);
  
  if (error) {
    console.error('Error deleting business profile:', error);
    throw error;
  }
  
  return true;
}

/**
 * Get current user's business profile from API route
 * 
 * @returns The business profile or null if not authenticated
 */
export async function getCurrentBusinessProfile(): Promise<BusinessProfile | null> {
  // This function should be used in API routes
  const supabase = createApiClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Authentication error:', userError);
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business profile:', error);
      throw error;
    }
    
    // If no profile exists, create a default one
    if (!data) {
      return await createDefaultBusinessProfile(user.id);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCurrentBusinessProfile:', error);
    throw error;
  }
}

/**
 * Create a default business profile for a user
 * 
 * @param userId User ID to create the profile for
 * @returns The created business profile
 */
async function createDefaultBusinessProfile(userId: string): Promise<BusinessProfile> {
  const supabase = createServiceRoleClient();
  
  // Create a basic profile with just the ID
  const { data, error } = await supabase
    .from('business_profiles')
    .insert({ 
      id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating default business profile:', error);
    throw error;
  }
  
  return data;
} 