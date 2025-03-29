// Import the User type from Supabase
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Gets the user's role from various possible locations in the user object.
 * Prioritizes direct role, then app_metadata.role.
 * @param user The user object from Supabase Auth, or null.
 * @returns The user's role or 'guest' if no user or role is found.
 */
export function getUserRole(user: SupabaseUser | null): string {
  if (!user) return 'guest';
  
  // Check for role in direct property (less common for Supabase roles)
  const directRole = user.role;
  if (directRole) {
    // Basic validation might be useful
    if (['admin', 'designer', 'client', 'partner'].includes(directRole))
      return directRole;
  }
  
  // Check for role in app_metadata object
  const metadataRole = user.app_metadata?.role;
  if (metadataRole && typeof metadataRole === 'string') {
    // Basic validation
    if (['admin', 'designer', 'client', 'partner'].includes(metadataRole))
      return metadataRole;
  }
  
  // NOTE: Parsing app_metadata as a string is highly unusual for Supabase Auth.
  // This case is kept for potential backward compatibility but should be investigated.
  if (typeof user.app_metadata === 'string') {
    try {
      const parsedMetadata = JSON.parse(user.app_metadata);
      if (parsedMetadata?.role && typeof parsedMetadata.role === 'string') {
         if (['admin', 'designer', 'client', 'partner'].includes(parsedMetadata.role))
           return parsedMetadata.role;
      }
    } catch (e) {
      console.error('Error parsing app_metadata string:', e);
    }
  }
  
  // Default role if nothing found or validated
  return 'guest'; // Consider if 'client' is a better default if user exists
}

/**
 * Checks if a user has a specific role, using case-insensitive partial matching
 * @param user The user object from Supabase Auth, or null.
 * @param rolePattern A string pattern to match against the user's role (e.g., 'admin', 'design')
 * @returns True if the user's role matches the pattern
 */
export function userHasRolePattern(user: SupabaseUser | null, rolePattern: string): boolean {
  const role = getUserRole(user).toLowerCase();
  return role.includes(rolePattern.toLowerCase());
}

/**
 * Checks if a user is a designer
 * @param user The user object from Supabase Auth, or null.
 * @returns True if the user is a designer
 */
export function isDesigner(user: SupabaseUser | null): boolean {
  return userHasRolePattern(user, 'design'); // Match 'designer'
}

/**
 * Checks if a user is an admin
 * @param user The user object from Supabase Auth, or null.
 * @returns True if the user is an admin
 */
export function isAdmin(user: SupabaseUser | null): boolean {
  return userHasRolePattern(user, 'admin');
}

/**
 * Checks if a user is a client
 * @param user The user object from Supabase Auth, or null.
 * @returns True if the user is a client
 */
export function isClient(user: SupabaseUser | null): boolean {
  // Assuming non-admin/non-designer are clients if they are logged in (not guest)
  const role = getUserRole(user);
  return role !== 'guest' && role !== 'admin' && role !== 'designer' && role !== 'partner'; // Explicitly check against known roles
} 