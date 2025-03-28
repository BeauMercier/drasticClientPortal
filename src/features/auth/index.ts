/**
 * Authentication Feature Module
 * 
 * This module handles user authentication, including:
 * - Login and logout
 * - User registration
 * - Password reset and recovery
 * - Authentication state and context
 * - User profile management
 */

// Re-export types
export * from './types';

// Re-export components
export {
  LoginForm,
  RegisterForm,
  PasswordResetForm,
  UpdatePasswordForm
} from './components';

// Re-export hooks
export { useAuth } from './hooks/useAuth';

// Re-export contexts
export { AuthProvider, useAuthContext } from './contexts/AuthContext';

// Re-export API functions
export {
  login,
  register,
  logout,
  resetPassword,
  updatePassword,
  updateProfile,
  getCurrentSession
} from './api'; 