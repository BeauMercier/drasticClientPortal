# TypeScript Issues Cleanup

## Current Type Issues

### TypeScript Error Suppressions
1. **Auth API module** (`src/features/auth/api/index.ts`):
   - 6 occurrences of `@ts-expect-error` for Supabase auth methods
   - Need to properly type Supabase auth methods: `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`, `getSession`

2. **Auth Context** (`src/features/auth/contexts/AuthContext.tsx`):
   - 1 occurrence of `@ts-expect-error` for `onAuthStateChange`

3. **Login Page** (`src/app/login/page.tsx`):
   - 2 occurrences of `@ts-expect-error` for `signInWithPassword`

### `any` Type Usage
1. **Auth Types**:
   - Line 22: `session: any;` in SessionCache interface

2. **User Utils** (`src/lib/utils.ts`):
   - Multiple user parameter typing issues (5 functions using `user: any`)

3. **FileContext** (`src/shared/contexts/FileContext.tsx`):
   - Type casting to `any` for Supabase storage methods

4. **Toast Hooks** (`src/shared/hooks/useToast.tsx`):
   - Options parameters using `any` type

5. **Billing Features**:
   - Multiple uses of `any` in billing API and hooks
   - Type casting to `any` for Supabase storage operations

6. **Projects Dashboard**:
   - `useState<any[]>([])` for projects state
   - `any[]` parameter types in render functions

7. **Admin API Routes**:
   - Type casting to `any` for database queries

8. **Settings Page**:
   - Type casting user metadata: `(user as any).user_metadata?.company`

### Type Casting
1. **Supabase Client** (`src/lib/api/client.ts`):
   - Casting to `unknown as SupabaseClient`

2. **Auth Context**:
   - Casting sessions to `unknown as Session`

3. **Storage Operations**:
   - Multiple instances of casting Supabase storage to `any`

### Schema and Interface Improvements
1. **Record Types**:
   - Multiple `Record<string, any>` usages that could be better typed

2. **Error Handling**:
   - Multiple `catch (err: any)` blocks that need proper error typing

3. **Database Schema Types**:
   - Need to expand the schema types to cover more tables

## Progress Made
- Created database schema types for better type safety
- Removed unused `@ts-expect-error` directives in projects API
- Updated project types to use database schema types
- Fixed imports for Supabase service file
- Added proper PostgrestResponse types

## Next Steps
1. Create proper type definitions for Supabase auth methods
2. Fix `User` and `Session` type issues in auth context
3. Create proper error types instead of using `any`
4. Expand database schema types
5. Replace `any[]` state types with proper interfaces
6. Add proper typing for user metadata 

## Long-Term Solution Plan

### 1. Complete Database Schema Types
- Generate complete types from Supabase using:
  ```bash
  npx supabase gen types typescript \
    --project-id brgtyzutexrumzwryisa \
    --schema public \
    > src/lib/database.types.ts
  ```
- Verify all tables are included in the types
- Add any missing table definitions manually if needed

### 2. Create Domain-Specific Type System
- Organize by business domain in `src/lib/types/`:
  - `user.ts` - User, Profile, Auth-related types
  - `project.ts` - Project, Revision, Project stages
  - `file.ts` - File storage and management types
  - `billing.ts` - Payment, Subscription, Invoice types
  - `task.ts` - Tasks, Assignments, Scheduling
  - `common.ts` - Shared utility types
  - `index.ts` - Export all types from a single entry point

### 3. Eliminate `any` Type Usage
- Create proper interfaces for user parameters in utils.ts
- Replace all `Record<string, any>` with typed records
- Replace `useState<any[]>` with proper typed arrays
- Add proper error types instead of `catch (err: any)`

### 4. Fix TypeScript Error Suppressions
- Create proper types for Supabase auth methods:
  - `signInWithPassword`
  - `signUp`
  - `resetPasswordForEmail`
  - `updateUser`
  - `getSession`
  - `onAuthStateChange`

### 5. Implement Proper Dynamic Table Typing
- Create helper types for dynamic table queries:
  ```typescript
  type TableName = 'web_design_projects' | 'logo_design_projects' | 'social_graphics_projects';
  type ProjectRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
  
  function createProjectQuery<T extends TableName>(client: SupabaseClient, tableName: T) {
    return client.from(tableName) as PostgrestFilterBuilder<Database['public']['Tables'][T]['Row']>;
  }
  ```

### 6. Standardize Toast Implementation
- Decide on one toast implementation (either UI component or react-hot-toast)
- Create consistent interface for all toast notifications
- Migrate all components to the chosen implementation

### 7. Complete Module Exports
- Implement proper index.ts files for all directories:
  - hooks
  - utils
  - constants
  - contexts
  - components

### 8. Enable Stricter TypeScript Checks
- Update tsconfig.json with stricter settings:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "useUnknownInCatchVariables": true
    }
  }
  ```

### 9. Implementation Priority
1. Database schema types (highest priority)
2. Auth-related types
3. User and project types
4. Component interface standardization
5. Utility function typing
6. Stricter TypeScript configuration (incremental) 