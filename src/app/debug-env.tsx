'use client'

import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '@/shared/services/supabase'

export default function DebugEnv() {
  const [envValues, setEnvValues] = useState<Record<string, string>>({})
  const [windowValues, setWindowValues] = useState<Record<string, unknown>>({})
  const [supabaseStatus, setSupabaseStatus] = useState<Record<string, unknown>>({})
  
  useEffect(() => {
    // Check process.env values
    setEnvValues({
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (hidden for security)' : 'not set',
      'NODE_ENV': process.env.NODE_ENV || 'not set',
    })
    
    // Check window.__NEXT_DATA__ values if available
    try {
      const nextData = window.__NEXT_DATA__?.runtimeConfig || {}
      setWindowValues({
        'window.__NEXT_DATA__.runtimeConfig': nextData ? {
          NEXT_PUBLIC_SUPABASE_URL: nextData.NEXT_PUBLIC_SUPABASE_URL || 'not set',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: nextData.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (hidden)' : 'not set'
        } : 'not available',
        'window.supabaseConfig': window.supabaseConfig ? {
          url: window.supabaseConfig.url ? 'set (hidden)' : 'not set',
          anonKey: window.supabaseConfig.anonKey ? 'set (hidden)' : 'not set'
        } : 'not available'
      })
    } catch (error) {
      setWindowValues({ error: 'Error accessing window values' })
    }
    
    // Test Supabase connection
    const checkSupabase = async () => {
      try {
        const result = await testSupabaseConnection()
        setSupabaseStatus(result)
      } catch (error) {
        setSupabaseStatus({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }
    
    checkSupabase()
  }, [])
  
  return (
    <div style={{ background: '#f2f2f2', padding: '1rem', margin: '1rem', borderRadius: '8px', maxWidth: '800px' }}>
      <h2 style={{ margin: '0 0 1rem 0' }}>Environment Debug</h2>
      
      <h3>process.env Values</h3>
      <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
        {JSON.stringify(envValues, null, 2)}
      </pre>
      
      <h3>Window Values</h3>
      <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
        {JSON.stringify(windowValues, null, 2)}
      </pre>
      
      <h3>Supabase Connection Test</h3>
      <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
        {JSON.stringify(supabaseStatus, null, 2)}
      </pre>
      
      <p style={{ fontSize: '0.8rem', color: '#666' }}>
        This component helps debug environment variable issues. Remove after troubleshooting.
      </p>
    </div>
  )
} 