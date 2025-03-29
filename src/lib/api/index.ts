/**
 * API Modules Index
 * 
 * This is the main entry point for client-safe API functionality.
 * It re-exports specific API modules for easier imports.
 * 
 * IMPORTANT: This file is designed to be safe to import in client components.
 * For server-component only functionality, import directly from relevant server files (e.g., @/lib/api/server.ts).
 */

// Re-export client-safe modules as namespaces
import * as storageModule from './storage';
import * as clientApiModule from './client-api';
import * as clientModule from './client';

// Export only client-safe modules
export { 
  storageModule,
  clientApiModule, 
  clientModule
};

// Export default instances for convenience
export { default as storage } from './storage';
export { default as clientApi } from './client-api';
export { default as supabase } from './client';

// DO NOT export server-utils from here as it contains server-only code 