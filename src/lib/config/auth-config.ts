import { UserRole } from '@/features/auth/types';

export const roleBasePaths: Record<UserRole, string> = {
  admin: '/admin',
  designer: '/designer',
  client: '/client',
  partner: '/partner',
  guest: '/login', // Guests are redirected to login
};

// It might be useful to also export the default role or a helper function
// to get a path, but for now, just the map is needed. 