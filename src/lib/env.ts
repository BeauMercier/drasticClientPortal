/**
 * Environment Variables Validation Utility
 * 
 * This module validates that all required environment variables are present
 * at application startup and provides typed access to them.
 */

// REMOVED complex fallback logic - relying solely on process.env

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

/**
 * Optional environment variables with their default values
 */
const OPTIONAL_ENV_VARS: Record<string, string> = {
  'NODE_ENV': 'development',
  'NEXT_PUBLIC_SITE_URL': typeof window !== 'undefined' ? window.location.origin : '',
  // Session timeout defaults (in seconds)
  'SESSION_TIMEOUT': '28800', // 8 hours
  'ADMIN_SESSION_TIMEOUT': '7200', // 2 hours
  // Feature flags
  'NEXT_PUBLIC_ENABLE_FILE_UPLOADS': 'true',
  'NEXT_PUBLIC_ENABLE_ADMIN_TOOLS': 'true',
  // API configuration
  'MAX_UPLOAD_SIZE': '5242880', // 5MB in bytes
};

/**
 * Gets a specific environment variable with fallbacks
 */
function getEnvVar(name: string): string | undefined {
  const isServer = typeof window === 'undefined';
  const context = isServer ? 'Server' : 'Client';
  console.log(`[env.ts - getEnvVar - ${context}] Attempting to get var: ${name}`);

  let value: string | undefined;

  // Use direct access for known NEXT_PUBLIC_ variables for build-time replacement
  if (name === 'NEXT_PUBLIC_SUPABASE_URL') {
    value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else if (name === 'NEXT_PUBLIC_SITE_URL') { // Added other known NEXT_PUBLIC_ vars
    value = process.env.NEXT_PUBLIC_SITE_URL;
  } else if (name === 'NEXT_PUBLIC_ENABLE_FILE_UPLOADS') {
    value = process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOADS;
  } else if (name === 'NEXT_PUBLIC_ENABLE_ADMIN_TOOLS') {
    value = process.env.NEXT_PUBLIC_ENABLE_ADMIN_TOOLS;
  } else {
    // For other vars (likely server-side), dynamic access is okay
    // Note: This might still be undefined client-side if not a NEXT_PUBLIC_ var
    value = process.env[name];
  }
  
  console.log(`[env.ts - getEnvVar - ${context}] Value for ${name}: ${value ? 'found (' + (typeof value === 'string' ? value.substring(0,5) : '?') + '...)' : 'NOT found'}`);

  if (!value && REQUIRED_ENV_VARS.includes(name)) {
    console.log(`[env.ts - getEnvVar - ${context}] Required Variable ${name} ultimately NOT FOUND.`);
  }
  
  // Return the found value or the default for optional vars if applicable
  return value ?? OPTIONAL_ENV_VARS[name]; 
}

/**
 * Validates that all required environment variables are present
 * @returns An object with validation results
 */
export function validateEnv(): { 
  valid: boolean; 
  missing: string[]; 
} {
  const missing: string[] = [];

  // Check for required env vars
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!getEnvVar(envVar)) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Reports validation results to the console
 * Throws an error in production if any required variables are missing
 */
export function reportEnvValidation(): void {
  const { valid, missing } = validateEnv();
  
  if (!valid) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    
    if (process.env.NODE_ENV === 'production') {
      console.error('⛔ ' + message);
      // Don't throw in production to allow fallbacks to work
    } else {
      console.warn('⚠️ ' + message);
    }
  }
}

/**
 * Gets all environment variables with proper typing
 * Includes defaults for optional variables
 */
export function getEnv() {
  // Direct access - validation will happen separately
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV || OPTIONAL_ENV_VARS.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || OPTIONAL_ENV_VARS.NEXT_PUBLIC_SITE_URL,
    // Session timeout values
    SESSION_TIMEOUT: Number(process.env.SESSION_TIMEOUT || OPTIONAL_ENV_VARS.SESSION_TIMEOUT),
    ADMIN_SESSION_TIMEOUT: Number(process.env.ADMIN_SESSION_TIMEOUT || OPTIONAL_ENV_VARS.ADMIN_SESSION_TIMEOUT),
    // Feature flags
    NEXT_PUBLIC_ENABLE_FILE_UPLOADS: 
      process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOADS || OPTIONAL_ENV_VARS.NEXT_PUBLIC_ENABLE_FILE_UPLOADS,
    NEXT_PUBLIC_ENABLE_ADMIN_TOOLS:
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_TOOLS || OPTIONAL_ENV_VARS.NEXT_PUBLIC_ENABLE_ADMIN_TOOLS,
    // API configuration
    MAX_UPLOAD_SIZE: Number(process.env.MAX_UPLOAD_SIZE || OPTIONAL_ENV_VARS.MAX_UPLOAD_SIZE),
  };
}

// Validate environment variables immediately
// This will now run the simplified getEnvVar
const { valid, missing } = validateEnv();
if (!valid) {
  const message = `Missing required environment variables: ${missing.join(', ')}`;
  // Always log error if missing, regardless of environment for clarity
  console.error('⛔ ' + message);
} 