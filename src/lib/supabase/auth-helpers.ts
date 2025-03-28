/**
 * Authentication Helper Utilities
 * 
 * Contains helper functions for managing Supabase authentication.
 */

import { supabase } from './client';

/**
 * Clears all Supabase-related items from localStorage 
 * and forces signOut to handle token refresh issues
 */
export async function clearAuthTokens() {
  console.log('Clearing auth tokens...');
  
  // First attempt to sign out to clear server cookies
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('Error in signOut during clearAuthTokens:', e);
  }
  
  // Then clear client-side storage
  if (typeof window !== 'undefined') {
    try {
      // Get all keys from localStorage
      const localStorageKeys = Object.keys(localStorage);
      
      // Filter for Supabase-related keys
      const supabaseKeys = localStorageKeys.filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      
      // Remove all Supabase-related items
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`Cleared ${supabaseKeys.length} Supabase-related items from localStorage`);
      
      // Also try the API endpoint for thorough cookie cleanup
      try {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.error('Error calling logout endpoint during clearAuthTokens:', e);
      }
      
      return supabaseKeys.length;
    } catch (e) {
      console.error('Error clearing localStorage in clearAuthTokens:', e);
      return 0;
    }
  }
  
  return 0;
}

/**
 * Handles refresh token errors by clearing tokens and redirecting
 */
export function handleRefreshTokenError(error: any) {
  // Check if it's a refresh token error
  if (error?.message?.includes('Refresh Token') || 
      error?.code === 'refresh_token_not_found') {
    
    console.error('Refresh token error detected:', error);
    
    // Clear tokens
    clearAuthTokens().then(() => {
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        
        // Add current path as redirect parameter
        const loginUrl = new URL('/login', window.location.origin);
        if (currentPath !== '/login' && !currentPath.includes('reset-password')) {
          loginUrl.searchParams.set('redirectedFrom', currentPath);
        }
        
        // Redirect
        window.location.href = loginUrl.toString();
      }
    });
    
    return true;
  }
  
  return false;
} 