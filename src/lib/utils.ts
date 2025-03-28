import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets the user's role from various possible locations in the user object
 * @param user The user object which might have role in different places
 * @returns The user's role or 'guest' if no role is found
 */
export function getUserRole(user: any): string {
  if (!user) return 'guest';
  
  // Check for role in direct property
  const directRole = user.role;
  if (directRole) return directRole;
  
  // Check for role in app_metadata object
  const metadataRole = user.app_metadata?.role;
  if (metadataRole) return metadataRole;
  
  // Check if app_metadata is a string that needs parsing
  if (typeof user.app_metadata === 'string') {
    try {
      const parsedMetadata = JSON.parse(user.app_metadata);
      if (parsedMetadata?.role) return parsedMetadata.role;
    } catch (e) {
      console.error('Error parsing app_metadata:', e);
    }
  }
  
  // Default role if nothing found
  return 'guest';
}

/**
 * Checks if a user has a specific role, using case-insensitive partial matching
 * @param user The user object
 * @param rolePattern A string pattern to match against the user's role (e.g., 'admin', 'design')
 * @returns True if the user's role matches the pattern
 */
export function userHasRolePattern(user: any, rolePattern: string): boolean {
  const role = getUserRole(user).toLowerCase();
  return role.includes(rolePattern.toLowerCase());
}

/**
 * Checks if a user is a designer
 * @param user The user object
 * @returns True if the user is a designer
 */
export function isDesigner(user: any): boolean {
  return userHasRolePattern(user, 'design');
}

/**
 * Checks if a user is an admin
 * @param user The user object
 * @returns True if the user is an admin
 */
export function isAdmin(user: any): boolean {
  return userHasRolePattern(user, 'admin');
}

/**
 * Checks if a user is a client
 * @param user The user object
 * @returns True if the user is a client
 */
export function isClient(user: any): boolean {
  return userHasRolePattern(user, 'client');
} 