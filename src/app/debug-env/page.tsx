'use client';

import React, { useEffect, useState } from 'react';
import { validateEnv } from '@/lib/env';

export default function DebugEnvironment() {
  const [debug, setDebug] = useState<{
    processEnv: {
      url?: string;
      anonKey?: string;
      serviceKey?: string;
    };
    windowConfig: {
      url?: string;
      anonKey?: string;
      serviceKey?: string;
    };
    nextData: {
      url?: string;
      anonKey?: string;
      serviceKey?: string;
    };
    validation: {
      valid: boolean;
      missing: string[];
    };
  }>({
    processEnv: {},
    windowConfig: {},
    nextData: {},
    validation: { valid: false, missing: [] }
  });

  useEffect(() => {
    // Check if window.supabaseConfig exists before accessing it
    if (!window.supabaseConfig) {
      window.supabaseConfig = {
        url: undefined,
        anonKey: undefined,
        serviceKey: undefined
      };
    }
    
    // Check environment variables
    setDebug({
      processEnv: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8)}...` : undefined,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` : undefined,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
          `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 8)}...` : undefined,
      },
      windowConfig: {
        url: window.supabaseConfig?.url ? 
          `${window.supabaseConfig.url.substring(0, 8)}...` : undefined,
        anonKey: window.supabaseConfig?.anonKey ? 
          `${window.supabaseConfig.anonKey.substring(0, 8)}...` : undefined,
        serviceKey: window.supabaseConfig?.serviceKey ? 
          `${window.supabaseConfig.serviceKey.substring(0, 8)}...` : undefined,
      },
      nextData: {
        url: window.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_URL ? 
          `${window.__NEXT_DATA__.runtimeConfig.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8)}...` : undefined,
        anonKey: window.__NEXT_DATA__?.runtimeConfig?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          `${window.__NEXT_DATA__.runtimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` : undefined,
        serviceKey: window.__NEXT_DATA__?.runtimeConfig?.SUPABASE_SERVICE_ROLE_KEY ? 
          `${window.__NEXT_DATA__.runtimeConfig.SUPABASE_SERVICE_ROLE_KEY.substring(0, 8)}...` : undefined,
      },
      validation: validateEnv()
    });
  }, []);

  return (
    <div className="container mx-auto mt-8 p-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4">Environment Debug</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Validation</h2>
        <div className="p-4 bg-gray-900 rounded">
          <p>Valid: {debug.validation.valid ? 'Yes' : 'No'}</p>
          {debug.validation.missing.length > 0 && (
            <div>
              <p>Missing:</p>
              <ul className="list-disc pl-6">
                {debug.validation.missing.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">process.env</h2>
          <div className="p-4 bg-gray-900 rounded">
            <p>URL: {debug.processEnv.url || 'Not found'}</p>
            <p>Anon Key: {debug.processEnv.anonKey || 'Not found'}</p>
            <p>Service Key: {debug.processEnv.serviceKey || 'Not found'}</p>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">window.supabaseConfig</h2>
          <div className="p-4 bg-gray-900 rounded">
            <p>URL: {debug.windowConfig.url || 'Not found'}</p>
            <p>Anon Key: {debug.windowConfig.anonKey || 'Not found'}</p>
            <p>Service Key: {debug.windowConfig.serviceKey || 'Not found'}</p>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">window.__NEXT_DATA__</h2>
          <div className="p-4 bg-gray-900 rounded">
            <p>URL: {debug.nextData.url || 'Not found'}</p>
            <p>Anon Key: {debug.nextData.anonKey || 'Not found'}</p>
            <p>Service Key: {debug.nextData.serviceKey || 'Not found'}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button 
          className="px-4 py-2 bg-blue-600 rounded-lg"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    </div>
  );
} 