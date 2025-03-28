// Global type definitions for the application

// Extend Window interface to include Next.js runtime configuration
interface Window {
  __NEXT_DATA__?: {
    props?: Record<string, unknown>;
    page?: string;
    query?: Record<string, unknown>;
    buildId?: string;
    assetPrefix?: string;
    runtimeConfig?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      [key: string]: string | undefined;
    };
    nextExport?: boolean;
    autoExport?: boolean;
    isFallback?: boolean;
    dynamicIds?: string[];
    err?: Error & { statusCode?: number };
    gsp?: boolean;
    gssp?: boolean;
    customServer?: boolean;
    gip?: boolean;
    appGip?: boolean;
  };
  
  // Fallback config for Supabase
  supabaseConfig?: {
    url?: string;
    anonKey?: string;
    serviceKey?: string;
  };
} 