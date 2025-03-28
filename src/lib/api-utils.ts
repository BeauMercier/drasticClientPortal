import { supabase } from './supabase/client';

/**
 * Helper function to make authenticated API calls
 * @param url API URL to call
 * @param options fetch options (optional)
 * @returns Response from the API
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Get session from Supabase
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    // Merge default headers with passed options
    const defaultHeaders = {
      'Authorization': `Bearer ${userId}`,
      'Content-Type': 'application/json'
    };
    
    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };
    
    // Make the API call
    const response = await fetch(url, mergedOptions);
    
    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    }
    
    // Return successful response
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
} 