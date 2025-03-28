# Drastic Client Portal Reorganization Checklist

Use this checklist to track progress as you implement the new architecture.

## Setup and Structure

- [x] Create feature directory structure
  - [x] `/src/features/auth`
  - [x] `/src/features/billing`
  - [x] `/src/features/files`
  - [x] `/src/features/projects`
  
- [x] Create feature subdirectories
  - [x] `/auth/api`
  - [x] `/auth/components`
  - [x] `/auth/contexts`
  - [x] `/auth/hooks`
  - [x] `/auth/types`
  - [x] `/billing/api`
  - [x] `/billing/components`
  - [x] `/billing/contexts`
  - [x] `/billing/hooks`
  - [x] `/billing/types`
  - [x] `/files/api`
  - [x] `/files/components`
  - [x] `/files/contexts`
  - [x] `/files/hooks`
  - [x] `/files/types`
  - [x] `/projects/api`
  - [x] `/projects/components`
  - [x] `/projects/contexts`
  - [x] `/projects/hooks`
  - [x] `/projects/types`

- [x] Create shared directory structure
  - [x] `/src/shared/config`
  - [x] `/src/shared/constants`
  - [x] `/src/shared/contexts`
  - [x] `/src/shared/hooks`
  - [x] `/src/shared/services`
  - [x] `/src/shared/services/api`
  - [x] `/src/shared/services/storage`
  - [x] `/src/shared/services/analytics`
  - [x] `/src/shared/types`
  - [x] `/src/shared/ui`
  - [x] `/src/shared/ui/buttons`
  - [x] `/src/shared/ui/forms`
  - [x] `/src/shared/ui/layout`
  - [x] `/src/shared/ui/feedback`
  - [x] `/src/shared/utils`
  - [x] `/src/shared/utils/date`
  - [x] `/src/shared/utils/formatting`
  - [x] `/src/shared/utils/validation`

## Dashboard Pages Migration

- [x] Create updated navigation sidebar
  - [x] Update sidebar to include links to new pages
  - [x] Fix linting errors in sidebar component

- [x] Create Management pages
  - [x] Create Website Management page (`/management/website`)
  - [x] Create Google Ads page (`/management/google-ads`)
  - [x] Create Analytics page (`/management/analytics`)

- [x] Create User pages
  - [x] Create My Profile page (`/my-profile`)
  - [ ] Create Settings page (`/settings`)

- [ ] Create Project pages
  - [ ] Create Project List page (`/projects`)
  - [ ] Create Project Detail page (`/projects/[id]`)
  
- [x] Create File pages
  - [x] Create File List page (`/files`)
  - [x] Implement file preview and download functionality

## Feature Migration: Auth

- [x] Migrate Auth components
  - [x] Move Login form components
  - [x] Move Registration form components
  - [x] Move Password reset components
  - [x] Move Password update components
  - [ ] Move Profile components
  
- [x] Migrate Auth hooks
  - [x] Move `useAuth.ts`
  - [x] Move other auth-related hooks
  
- [x] Migrate Auth context
  - [x] Move `AuthContext.tsx`
  
- [x] Migrate Auth types
  - [x] Create `types/index.ts` with auth types
  
- [x] Migrate Auth API
  - [x] Create auth API functions in `/auth/api`
  
- [x] Create Auth feature exports
  - [x] Create `/auth/index.ts` with public exports

## Feature Migration: Billing

- [ ] Migrate Billing components
  - [ ] Move `InvoiceList` component
  - [ ] Move Payment form components
  - [ ] Move Subscription components
  
- [ ] Migrate Billing hooks
  - [ ] Move `useBillingInvoices.ts`
  - [ ] Move other billing-related hooks
  
- [ ] Migrate Billing context
  - [ ] Move or create `BillingContext.tsx`
  
- [ ] Migrate Billing types
  - [ ] Create `types/index.ts` with billing types
  
- [ ] Migrate Billing API
  - [ ] Create billing API functions in `/billing/api`
  
- [ ] Create Billing feature exports
  - [ ] Create `/billing/index.ts` with public exports

## Feature Migration: Files

- [x] Migrate File components
  - [x] Move `FileList` component
  - [x] Implement File upload functionality
  - [x] Add image preview and gallery view
  - [x] Add tabbed interface for file categories
  
- [x] Migrate File hooks
  - [x] Implement file management hooks
  - [x] Add preview URL generators
  
- [x] Migrate File context
  - [x] Create `FileContext.tsx` with proper storage integration
  - [x] Implement bucket initialization and error handling
  - [x] Fix re-rendering issues with useRef for toast
  
- [x] Migrate File types
  - [x] Create file object types with proper interfaces
  
- [x] Migrate File API
  - [x] Create download URL API endpoint
  - [x] Implement auth-aware file operations
  - [x] Add service role support for downloads
  
- [x] Create Files feature exports
  - [x] Create public file management components

## Feature Migration: Projects

- [ ] Migrate Project components
  - [ ] Move Project list components
  - [ ] Move Project detail components
  - [ ] Move Project form components
  - [ ] Move Revision components
  
- [ ] Migrate Project hooks
  - [ ] Move `useRevisions.ts`
  - [ ] Move `useRevisionComments.ts`
  - [ ] Move other project-related hooks
  
- [ ] Migrate Project context
  - [ ] Move `ProjectContext.tsx`
  
- [ ] Migrate Project types
  - [ ] Create `types/index.ts` with project types
  
- [ ] Migrate Project API
  - [ ] Create project API functions in `/projects/api`
  
- [ ] Create Projects feature exports
  - [ ] Create `/projects/index.ts` with public exports

## Shared Component Migration

- [ ] Identify and migrate UI components
  - [ ] Move button components to `/shared/ui/buttons`
  - [ ] Move form components to `/shared/ui/forms`
  - [ ] Move layout components to `/shared/ui/layout`
  - [ ] Move toast/alert components to `/shared/ui/feedback`
  
- [ ] Migrate shared hooks
  - [ ] Move `useToast.ts`
  - [ ] Move other shared hooks
  
- [ ] Migrate shared contexts
  - [x] Update `UIContext.tsx` with proper theme handling
  - [ ] Move other shared contexts
  
- [ ] Create shared types
  - [ ] Create base entity types
  - [ ] Create utility types
  
- [ ] Migrate utility functions
  - [ ] Move date utilities
  - [ ] Move formatting utilities
  - [ ] Move validation utilities

## API Refactoring

- [ ] Create base API client
  - [ ] Create `/shared/services/api/client.ts`
  
- [ ] Refactor Supabase client
  - [ ] Move to `/shared/services/api/supabase.ts`
  
- [ ] Split API functions by feature
  - [ ] Identify and move auth API functions
  - [ ] Identify and move billing API functions
  - [ ] Identify and move file API functions
  - [ ] Identify and move project API functions

## Import Path Updates

- [ ] Update Auth feature imports
  - [ ] Fix imports in Auth components
  - [ ] Fix imports in Auth hooks
  - [ ] Fix imports in Auth context
  
- [ ] Update Billing feature imports
  - [ ] Fix imports in Billing components
  - [ ] Fix imports in Billing hooks
  - [ ] Fix imports in Billing context
  
- [ ] Update Files feature imports
  - [ ] Fix imports in File components
  - [ ] Fix imports in File hooks
  - [ ] Fix imports in File context
  
- [ ] Update Projects feature imports
  - [ ] Fix imports in Project components
  - [ ] Fix imports in Project hooks
  - [ ] Fix imports in Project context
  
- [ ] Update Page imports
  - [ ] Fix imports in page components

## Cleanup

- [ ] Remove empty directories
  - [ ] Clean up `/src/components`
  - [ ] Clean up `/src/hooks`
  - [ ] Clean up `/src/contexts`
  - [ ] Clean up `/src/types`
  
- [ ] Fix linting errors
  - [ ] Run `npm run lint`
  - [ ] Address all linting issues
  
- [ ] Fix type errors
  - [ ] Run type checking
  - [ ] Address type issues

## Testing

- [x] Test authentication
  - [x] Verify login/logout works
  - [x] Verify protected routes work
  
- [ ] Test billing functionality
  - [ ] Verify invoice listing works
  - [ ] Verify payment functionality works
  
- [x] Test file functionality
  - [x] Verify file upload works
  - [x] Verify file listing works
  - [x] Verify file download and preview works
  - [x] Verify gallery and list view modes work
  
- [ ] Test project functionality
  - [ ] Verify project creation works
  - [ ] Verify project listing works
  - [ ] Verify revisions work

- [x] Test admin functionality
  - [x] Verify admin users page loads correctly
  - [x] Verify admin projects page loads correctly
  - [x] Verify service role authentication works

## Diagnostic Tools

- [x] Create API diagnostic endpoints
  - [x] Created `/api/supabase-test` for connection testing
  - [x] Created `/api/admin/test-service-key` for service role validation
  - [x] Created `/api/admin/list-users` for minimal auth API testing
  - [x] Added verbose logging in API routes for debugging

- [x] Environment variable management
  - [x] Standardized environment variable naming across codebase
  - [x] Created validation functions to check for required variables
  - [x] Added graceful fallbacks for missing environment variables
  - [x] Added detailed console logging for configuration issues

## Authentication Fixes

Authentication was fixed by implementing the following changes:

- [x] Consolidated Supabase client implementation
  - [x] Created a single source of truth for the Supabase client in `src/lib/supabase/client.ts`
  - [x] Made shared services re-export from lib implementation
  - [x] Removed duplicate client implementations

- [x] Updated API keys and configuration
  - [x] Fixed "Invalid API key" error by updating to the correct API keys
  - [x] Added proper CORS configuration in `.env.local`
  - [x] Configured local and remote allowed origins

- [x] Enhanced error handling and debugging
  - [x] Added comprehensive connection testing
  - [x] Created debug utilities and test endpoints
  - [x] Implemented detailed error reporting

- [x] Standardized auth module usage
  - [x] Fixed auth component imports
  - [x] Ensured consistent API usage across components
  - [x] Added proper TypeScript types for better error detection

## Admin Dashboard Fixes

Admin dashboard functionality was fixed by implementing the following changes:

- [x] Fixed service role key implementation
  - [x] Corrected environment variable naming (`SUPABASE_SERVICE_ROLE_KEY` vs `SUPABASE_SERVICE_KEY`)
  - [x] Created dedicated `createServiceRoleClient()` function for admin operations
  - [x] Added proper error handling when service role key is missing

- [x] Aligned database schema with frontend expectations
  - [x] Updated API to query correct project tables (`web_design_projects`, `logo_design_projects`, `social_graphics_projects`)
  - [x] Implemented consistent data transformation for project objects
  - [x] Added fallbacks for potentially undefined fields to prevent frontend errors

- [x] Enhanced admin API security
  - [x] Implemented proper admin access verification
  - [x] Added specific error messages for debugging
  - [x] Created graceful fallbacks when admin API functionality isn't available

- [x] Implemented robust error handling
  - [x] Added fallback mechanism for auth.admin.listUsers() failures
  - [x] Created graceful degradation path using profiles table data
  - [x] Added detailed logging for API failures and fallback processes
  - [x] Ensured consistent response formats regardless of data source

## UI and Theme Implementation

- [x] Fix light/dark theme implementation
  - [x] Update sidebar to use true black in dark mode with red accents
  - [x] Update card component to use true black in dark mode
  - [x] Update button and badge styling for dark mode
  - [x] Add theme toggle in header
  - [x] Create consistent color scheme with black background, red accents, and white text in dark mode

## Documentation

- [ ] Update README.md
  - [ ] Add architecture overview
  - [ ] Add development guide
  
- [ ] Create specific documentation
  - [ ] Document feature modules
  - [ ] Document shared components 