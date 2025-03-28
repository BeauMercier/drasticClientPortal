/**
 * API Modules Index
 * 
 * This is the main entry point for all API functionality.
 * It re-exports specific API modules for easier imports.
 * 
 * IMPORTANT: This file is designed to be safe to import in client components.
 * For server-component only functionality, import directly from server-utils.ts.
 */

// Re-export client-safe modules as namespaces
import * as storageModule from './storage';
import * as clientApiModule from './client-api';
import * as adminModule from './admin';
import * as clientModule from './client';
import * as serverModule from './server';

// Export all client-safe modules
export { 
  storageModule,
  clientApiModule, 
  adminModule,
  clientModule,
  serverModule
};

// Export default instances for convenience
export { default as storage } from './storage';
export { default as clientApi } from './client-api';
export { default as admin } from './admin';
export { default as supabase } from './client';
export { default as serverClient } from './server';

// DO NOT export server-utils from here as it contains server-only code 