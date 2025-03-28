'use client';

import { useEffect } from 'react';

/**
 * Client-side component that ensures environment variables are available
 * by setting up fallback mechanisms without hardcoding any sensitive values
 */
export default function EnvFallback() {
  useEffect(() => {
    // This runs only in the browser
    if (typeof window !== 'undefined') {
      // Create supabaseConfig if it doesn't exist
      window.supabaseConfig = window.supabaseConfig || {
        url: undefined,
        anonKey: undefined,
        serviceKey: undefined,
      };

      // IMPORTANT: Set values from process.env directly
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        window.supabaseConfig.url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      }
      
      if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.supabaseConfig.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
      
      // Try to get from Next.js runtime config if still missing
      if (window.__NEXT_DATA__?.runtimeConfig) {
        // Only update if values are still missing
        const runtimeConfig = window.__NEXT_DATA__.runtimeConfig;
        
        if (!window.supabaseConfig.url && runtimeConfig.NEXT_PUBLIC_SUPABASE_URL) {
          window.supabaseConfig.url = runtimeConfig.NEXT_PUBLIC_SUPABASE_URL;
        }
        
        if (!window.supabaseConfig.anonKey && runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          window.supabaseConfig.anonKey = runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        }
      }
      
      console.log('Environment fallback initialized', {
        fromEnv: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'
        },
        inWindow: {
          url: window.supabaseConfig.url ? 'set' : 'missing',
          anonKey: window.supabaseConfig.anonKey ? 'set' : 'missing'
        }
      });
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 