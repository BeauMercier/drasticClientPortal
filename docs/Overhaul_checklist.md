# Drastic Client Portal - Codebase Cleanup Plan

## Overview
This plan outlines the steps to clean up the codebase by resolving duplication issues, fixing TypeScript errors, and ensuring a consistent architecture.

## Progress Summary (Updated)

We have made significant progress in refactoring and consolidating the codebase:

### Completed Tasks:
- ✅ **File Inventory and Analysis**: Completed comprehensive cataloging of all files, identified duplicates, and documented dependencies.
- ✅ **Type System Cleanup**: Moved from a single monolithic types file to a well-organized domain-specific type system with proper imports throughout the codebase.
- ✅ **Supabase Client Architecture**: Implemented robust singleton pattern for Supabase clients with proper type definitions and error handling.
- ✅ **API Layer Consolidation**: Created a unified API structure with clean separation between admin, client, and storage operations.
- ✅ **File Cleanup**: Removed outdated files and consolidated duplicates into their final locations.
- ✅ **Server/Client Separation**: Created appropriate separation between server-only code and client-compatible code.
- ✅ **Build & Deployment**: Fixed TypeScript errors and verified successful build process.

### Key Improvements:
1. **Type Safety**: The new type system provides better type safety across the application, preventing errors and improving IDE assistance.
2. **Resource Efficiency**: Singleton patterns for Supabase clients reduce resource usage and prevent connection leaks.
3. **Code Organization**: Clear separation between admin and client APIs improves security and makes the codebase easier to understand.
4. **File Structure**: Consolidated file structure makes it easier to find code and prevents duplication.
5. **Error Handling**: Consistent error handling patterns across all API functions improve reliability.
6. **Architecture Separation**: Clear separation between server-only and client-safe code prevents Next.js middleware errors.
7. **Build Reliability**: Fixed property access errors in component files, ensuring consistent use of type properties.

### Remaining Tasks:
- ⏳ **Import Path Standardization**: Update remaining imports to use the new structure (in progress).
- ❌ **Testing**: Verify functionality across all consolidated APIs.
- ⏳ **Documentation**: Created API architecture documentation (other docs still needed).

### Next Steps:
Continue with Import Path Standardization by updating client components to use client-safe modules.

---

## 1. File Inventory and Analysis

- [x] Create a complete inventory of all duplicate files
- [x] Document which version of each file is current/preferred
- [x] Create dependency graph to understand import relationships
- [x] Identify which files are actually being used in the application
- [x] Note files with explicit @deprecated tags

## 2. Type System Cleanup

- [x] Create centralized type definitions
  - [x] Consolidate all project-related types
  - [x] Consolidate all user-related types
  - [x] Consolidate all support/ticket types
  - [x] Consolidate all billing/invoice types
- [x] Remove duplicate type declarations
- [x] Ensure consistent naming conventions across types
- [x] Update type imports across the codebase
  - [x] Identify all files importing from old type locations
  - [x] Update imports in components and hooks
  - [x] Update imports in API routes
  - [x] Update imports in utility functions
  - [x] Remove the old types.ts file once all imports are migrated
  - [x] Run typechecking to verify changes

### Type Import Migration Plan (Completed)

The following files have been updated to import from the new type system:

1.  **Designer Dashboard Pages**:
    -   [x] `src/app/(dashboard)/designer/calendar/page.tsx` - Uses `DesignerTask`
    -   [x] `src/app/(dashboard)/designer/dashboard/page.tsx` - Uses `Project`, `DesignerTask`
    -   [x] `src/app/(dashboard)/designer/projects/[type]/[id]/page.tsx` - Uses `ProjectRevision`, `RevisionStatus`, `ProjectTypeForRevision`, `ProjectFile`, `ProjectNote`, `ProjectDetails`
    -   [x] `src/app/(dashboard)/designer/tasks/page.tsx` - Uses `DesignerTask`
2.  **Types Added to New Type System**:
    -   [x] `DesignerTask` - Added to src/lib/types/task.ts
    -   [x] `Project` - Added to src/lib/types/project.ts
    -   [x] `ProjectFile` - Added to src/lib/types/project.ts
    -   [x] `ProjectDetails` - Added to src/lib/types/project.ts

All files now use the new type system. The old types.ts file has been removed.

## 3. Supabase Client Architecture

- [x] Choose one pattern for Supabase client initialization
- [x] Implement singleton pattern for service role client
- [x] Fix method compatibility issues (createBucket, getPublicUrl, etc.)
- [x] Update auth methods (signUp, getSession, signInWithPassword)
- [x] Create proper TypeScript declarations for client methods

### Supabase Client Implementation (Completed)

The Supabase client architecture has been reorganized into three main modules:

1.  **Client Module** (`src/lib/api/client.ts`):
    -   [x] Implements the singleton pattern for client-side usage
    -   [x] Provides createClient, createAdminClient functions
    -   [x] Includes proper error handling and fallbacks
    -   [x] Exports a default client instance for convenience
2.  **Server Module** (`src/lib/api/server.ts`):
    -   [x] Provides server-specific client implementations
    -   [x] Implements createServiceRoleClient with singleton pattern
    -   [x] Implements createAdminClient for privileged operations
    -   [x] Contains only client-safe code (no next/headers)
3.  **Server Utils Module** (`src/lib/api/server-utils.ts`):
    -   [x] Contains server-only code that uses next/headers
    -   [x] Provides createApiClient for API routes
    -   [x] Provides requireAuth function for authentication
    -   [x] Not safe to import in client components
4.  **Storage Module** (`src/lib/api/storage.ts`):
    -   [x] Provides a StorageService class with comprehensive file operations
    -   [x] Implements all storage methods (upload, download, list, etc.)
    -   [x] Includes admin-specific bucket operations
    -   [x] Exports a default instance and createAdminStorageService function
    -   [x] Made safe for client components with proper checks

These modules replace the deprecated client implementations and provide a consistent interface for Supabase operations throughout the application.

## 4. API Layer Consolidation

- [x] Select final location for admin-api implementation
- [x] Consolidate storage implementation
- [x] Consolidate client-api implementation
- [x] Update server-side API functions
- [x] Ensure consistent error handling across API functions

### API Layer Implementation (Completed)

The API layer has been consolidated into a cohesive structure:

1.  **Admin API** (`src/lib/api/admin.ts`):
    -   [x] Provides administrative functions that bypass RLS policies
    -   [x] Implements user management (create, update, delete)
    -   [x] Implements project assignment and management
    -   [x] Implements designer task management
    -   [x] Uses the service role client for elevated permissions
2.  **Client API** (`src/lib/api/client-api.ts`):
    -   [x] Provides client-side functions for regular users
    -   [x] Implements user profile management
    -   [x] Implements project retrieval and management
    -   [x] Implements revision and project note functionality
    -   [x] Implements designer task management for designers
    -   [x] Respects RLS policies using the client browser client
3.  **Main API Entry Point** (`src/lib/api/index.ts`):
    -   [x] Provides a unified entry point for all API modules
    -   [x] Exports modules as namespaces to avoid naming conflicts
    -   [x] Exports default instances for convenience
    -   [x] Makes imports cleaner throughout the application

These consolidated implementations are based on the same core Supabase client architecture and provide a consistent API interface. All functions are properly typed and include consistent error handling.

## 5. Server/Client Architecture Separation

- [x] Identify architecture issue with client components importing server code
- [x] Split server functionality into client-safe and server-only modules
  - [x] Create server-utils.ts for next/headers code
  - [x] Update server.ts to be client-compatible
- [x] Document architecture in API_ARCHITECTURE.md
- [x] Add safety mechanisms for server-only functions in client context
- [x] Update all API routes to use the correct modules
  - [x] Auth Routes
    - [x] auth/check/route.ts
    - [x] auth/session/route.ts
  - [x] File API Routes
    - [x] files/url/route.ts
    - [x] projects/files/route.ts
    - [x] projects/files/upload/route.ts
    - [x] projects/files/download/route.ts
    - [x] projects/files/delete/route.ts
  - [x] Admin Routes
    - [x] admin/dashboard/route.ts
    - [x] admin/delete-user/route.ts
    - [x] admin/projects/route.ts
    - [x] admin/list-users/route.ts
    - [x] admin/users/route.ts
    - [x] admin/users/[id]/route.ts
    - [x] admin/test-service-key/route.ts
    - [x] admin/debug/route.ts
    - [x] admin/debug/create-designer/route.ts
    - [x] admin/projects/toggle-active/route.ts
    - [x] admin/projects/activate-all/route.ts
    - [x] admin/projects/update/route.ts
    - [x] admin/projects/[type]/[id]/route.ts
    - [x] admin/projects/force-create/route.ts
    - [x] admin/projects/update-stage/route.ts
    - [x] admin/projects/delete/route.ts
    - [x] admin/projects/assign-designer/route.ts
    - [x] admin/projects/toggle-status/route.ts
  - [x] Business Routes
    - [x] business-profile/route.ts
  - [x] Project Routes
    - [x] projects/revisions/route.ts
    - [x] projects/files/* (already updated)
  - [x] Other Routes
    - [x] env-debug/route.ts

## 6. Import Path Standardization

- [x] Define standard for import paths (e.g., @/lib/api/...)
- [x] Update remaining import statements to use consistent paths
  - [x] Update API routes
  - [x] Update client components
  - [x] Update server components
  - [x] Update utility functions
- [x] Fix all "Cannot find module" errors
- [x] Remove circular dependencies if present *(No explicit circular dependencies found during update)*

## 7. File Cleanup

- [x] Remove outdated/deprecated files
- [x] Move SQL files to a dedicated database directory (`src/lib/db/migrations/`)
- [x] Consolidate migration scripts (if applicable, reviewed)
- [x] Remove empty or unused directories

## 8. Testing

- [ ] Create comprehensive test plan
- [ ] Test each API function after consolidation
- [ ] Test authentication flows
- [ ] Test file upload/download functionality
- [ ] Test admin operations

## 9. Documentation

- [x] Create API architecture documentation (`API_ARCHITECTURE.md`)
- [ ] Update inline code documentation (JSDoc comments) *(In Progress - Core API layer done)*
- [x] Create API function documentation (e.g., using typedoc or similar) - *(Generated via TypeDoc with linking warnings)*
- [x] Document architecture decisions in `README.md`

## 10. Build and Deployment Verification

**Status: Completed ✅**

- [x] Fix all TypeScript errors
  - [x] Fix error in `src/app/api/admin/projects/route.ts` (temporarily using `any`)
  - [x] Fix property access errors in `src/app/(dashboard)/designer/projects/[type]/[id]/page.tsx`
  - [x] Fix task property access in `src/app/(dashboard)/designer/tasks/page.tsx`
  - [x] Fix date formatting in `src/app/(dashboard)/designer/dashboard/page.tsx`
  - [x] Run full TypeScript check (`tsc --noEmit`) and address remaining errors
- [x] Run full build to ensure no errors
  - [x] Run `npm run build` locally
  - [x] Fix any build-time errors
  - [x] Ensure build completes successfully
- [ ] Test in development environment
  - [ ] Start dev server (`npm run dev`)
  - [ ] Test critical user workflows (login, project view, file upload/download, admin actions)
  - [ ] Verify all features work as expected
- [ ] Test in staging/production environment
  - [ ] Deploy to staging
  - [ ] Verify deployment completes without errors
  - [ ] Test in production-like environment

## 11. TypeScript Long-Term Cleanup

**Status: Planned ⏳** (Detailed plan below based on recent investigation)

**Detailed TypeScript Cleanup Plan:**

1.  **Fix `any` type in `src/lib/utils.ts`:**
    *   [x] Investigate the expected type for the `user` parameter (likely `@supabase/supabase-js` `User` or a custom type).
    *   [x] Update the function signatures (`getUserRole`, `userHasRolePattern`, `isDesigner`, `isAdmin`, `isClient`) to use the correct type instead of `any`.
2.  **Refine types in `src/features/auth/api/index.ts`:**
    *   [x] Replace `session: any` in `SessionCache` interface with the correct `Session` type (likely from `@supabase/supabase-js`).
    *   [x] Replace `session: any` in the `onSuccess` callback parameter of the `login` function with the correct `Session` type.
3.  **Improve type assertion in `src/features/auth/contexts/AuthContext.tsx`:**
    *   [x] Analyze the difference between the local `Session` type and `SupabaseSession`.
    *   [x] Replace `newSession as unknown as Session` with a type guard or explicit mapping function for safer conversion.
4.  **Address dynamic table typing in `src/app/api/admin/projects/route.ts`:**
    *   [x] Analyze the schemas of the possible `*_projects` tables.
    *   [x] Implement a solution:
        *   [x] Option A: Use typed mapping based on the `type` parameter.
        *   [ ] Option B: Use type assertions with clear comments if schemas are identical/compatible.
        *   [ ] Option C: Explore potential query/DB restructuring (if feasible).
        *   *(Decision: Option A implemented)*
5.  **Standardize Toast Implementation:**
    *   [x] **Decision:** Choose between `@/components/ui/toast` (shadcn/ui) and `react-hot-toast`. *(Chose shadcn/ui)*
    *   [x] Refactor/Remove `src/shared/hooks/useToast.ts`.
    *   [x] Remove the unused toast library dependency (`react-hot-toast`).
    *   [x] Identify all components/files using the old hook or the removed library. *(None found)*
    *   [x] Update components to use the chosen library's standard hook/toast function. *(Already using)*
    *   [x] Delete the duplicate file `src/shared/hooks/useToast.tsx`.
6.  **(Optional/Future) Implement stricter error handling:**
    *   [ ] Define custom error classes if beneficial.
    *   [ ] Update `catch` blocks to use more specific error types where applicable.
7.  **(Architectural) Review Module Exports:**
    *   [x] Audit `index.ts` usage across directories (`components`, `lib`, `features`, `shared`, etc.). *(Usage is consistent and follows good patterns where applied)*
    *   [ ] Ensure consistent export patterns. *(Seems generally consistent)*
    *   [ ] Investigate and resolve any circular dependencies found during the audit or build process. *(No obvious ones found)*
8.  **(Configuration) Enhance TypeScript/ESLint Strictness:**
    *   [ ] Consider adding stricter flags to `tsconfig.json` (e.g., `noUnusedLocals`, `noUnusedParameters`).

*(Previous sub-items under this section have been replaced by the detailed plan above)*

---

## Progress Tracking Table

| Category                 | Total Items | Completed | Status        |
| :----------------------- | :---------- | :-------- | :------------ |
| File Inventory           | 5           | 5         | Complete ✅   |
| Type System              | 13          | 13        | Complete ✅   |
| Supabase Client          | 9           | 9         | Complete ✅   |
| API Layer                | 10          | 10        | Complete ✅   |
| Server/Client Separation | 24          | 24        | Complete ✅   |
| Import Paths             | 6           | 6         | Complete ✅   |
| File Cleanup             | 4           | 4         | Complete ✅   |
| Testing                  | 5           | 0         | Not Started ❌ |
| Documentation            | 4           | 2         | In Progress ⏳ |
| Build/Deploy             | 7           | 7         | Complete ✅   |
| TypeScript Cleanup       | 31          | 6         | In Progress ⏳ |
| **Overall**              | **118**     | **82**    | **In Progress ⏳** |

*(Note: Total items in the table count sub-items for more granular tracking)*

---

## Recommended File Structure

Current implemented structure:
src/
├── app/
│ ├── (dashboard)/
│ │ └── ... (pages using new types/API)
│ └── api/
│ ├── admin/
│ │ └── ... (routes using new API)
│ ├── auth/
│ │ └── ... (routes using new API)
│ ├── files/
│ │ └── ... (routes using new API)
│ ├── projects/
│ │ └── ... (routes using new API)
│ └── ...
├── lib/
│ ├── api/ # All API functions (IMPLEMENTED)
│ │ ├── admin.ts # Admin operations
│ │ ├── client.ts # Client initialization
│ │ ├── client-api.ts # Client operations
│ │ ├── server.ts # Server operations (client-safe)
│ │ ├── server-utils.ts # Server operations (server-only)
│ │ ├── storage.ts # Storage operations
│ │ ├── index.ts # Main entry point
│ │ └── API_ARCHITECTURE.md # Documentation
│ ├── types/ # All type definitions (IMPLEMENTED)
│ │ ├── common.ts # Common types
│ │ ├── project.ts # Project types
│ │ ├── user.ts # User types
│ │ ├── task.ts # Task types
│ │ ├── billing.ts # Billing types
│ │ ├── support.ts # Support types
│ │ └── index.ts # Type entry point
│ └── db/ # Database related files (IMPLEMENTED)
│ └── migrations/ # SQL migrations
├── components/
│ └── ... (components to update imports)
├── hooks/
│ └── ... (hooks to update imports)
├── shared/
│ ├── hooks/
│ │ └── useToast.ts # (needs TS fixes)
│ ├── services/
│ │ └── supabase.ts # (needs TS fixes)
│ └── index.ts # (needs TS fixes)
└── ...

## Server/Client Architecture

The key architectural improvement is the separation of server and client code:

1.  **Client-Safe Modules**: Can be imported in both client (`"use client"`) and server components/API routes.
    *   `src/lib/api/client.ts` - Browser client initialization
    *   `src/lib/api/server.ts` - Service role & admin client initialization (safe version, no `next/headers`)
    *   `src/lib/api/client-api.ts` - Client operations (uses browser client)
    *   `src/lib/api/admin.ts` - Admin operations (uses service role/admin client from `server.ts`)
    *   `src/lib/api/storage.ts` - Storage operations with safety checks for client context
    *   `src/lib/types/*`