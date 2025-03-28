# Root Directory and Duplicate Files Cleanup Plan

## Overview
This document outlines the steps to clean up the codebase's root directory and remove duplicated files to achieve a more organized and maintainable structure.

## 1. Root Directory Organization

### SQL Files
Move all SQL files from the root directory to appropriate locations:

- [ ] Move `admin_delete_user.sql` to `src/lib/db/migrations/`
- [ ] Move `permanent_rls_fix.sql` to `src/lib/db/migrations/`
- [ ] Move `permanent_rls_fix_for_all_tables.sql` to `src/lib/db/migrations/`
- [ ] Move `safe_implement_rls_policies.sql` to `src/lib/db/migrations/`

### Documentation Files
Organize documentation files:

- [ ] Move `admin-projects-checklist.md` to `docs/`
- [ ] Move `RLS_FIX_CHECKLIST.md` to `docs/`
- [ ] Move `SECURITY_IMPROVEMENTS.md` to `docs/`
- [ ] Keep `README.md` in root for project overview
- [ ] Move `PRODUCTION_NOTES.md` to `docs/`
- [ ] Keep `CODEBASE_CLEANUP_PLAN.md` in root until cleanup is complete
- [ ] Remove `CODEBASE_CLEANUP_PLAN_backup.md` (redundant backup)

## 2. Duplicate Files Cleanup

### Duplicate TypeScript Files
Remove duplicate files based on the file inventory in the CODEBASE_CLEANUP_PLAN:

- [ ] Remove `src/lib/client-api.ts` (deprecated, use `src/lib/api/client-api.ts` instead)
- [ ] Remove `src/lib/supabase/client-api.ts` (deprecated, use `src/lib/api/client-api.ts` instead)
- [ ] Remove `src/lib/supabase/client.ts` (deprecated, use `src/lib/api/client.ts` instead)
- [ ] Remove `src/lib/admin-api.ts` (use `src/lib/api/admin.ts` instead)
- [ ] Remove `src/lib/supabase/admin.ts` (use `src/lib/api/server.ts` instead)
- [ ] Remove `src/lib/supabase/api-auth.ts` (use `src/lib/api/server-utils.ts` instead)
- [ ] Create a deprecation notice in these files pointing to their replacements (if we can't directly remove them)

### Type Definition Files
Clean up deprecated type files:

- [ ] Remove `src/lib/types.ts` (migrated to `src/lib/types/`)
- [ ] Remove `src/lib/supabase/types.ts` (migrated to `src/lib/types/`)
- [ ] Remove `src/lib/database.types.ts` (verify if used or can be consolidated)
- [ ] Remove `src/lib/supabase/database.types.ts` (verify if used or can be consolidated)

### Server-related Files
Clean up deprecated server files:

- [ ] Remove `src/lib/server-api.ts` (unused)
- [ ] Remove `src/lib/supabase/server-api.ts` (unused)

### Migration Files
Consolidate migration files:

- [ ] Move `src/lib/apply-migrations.js` to `src/lib/db/apply-migrations.js`
- [ ] Move `src/lib/supabase/apply-migrations.js` to `src/lib/db/apply-migrations.js` (merge if different)
- [ ] Move `src/lib/apply-migrations.mjs` to `src/lib/db/apply-migrations.mjs`
- [ ] Move `src/lib/supabase/apply-migrations.mjs` to `src/lib/db/apply-migrations.mjs` (merge if different)

## 3. Execution Plan

1. **First Phase**: 
   - Create deprecation notices in files we can't immediately delete
   - Move SQL files to organized locations
   - Move documentation files to docs folder

2. **Second Phase**:
   - Verify all imports are updated to use the new files
   - Remove deprecated files that are no longer imported anywhere
   - Consolidate migration files and scripts

3. **Final Phase**:
   - Run typecheck and build to verify no errors
   - Test application functionality 
   - Remove any leftover temporary files

## 4. Impact Assessment

Before removing any file, we must:
1. Check how many files import it
2. Verify if the replacement is fully compatible
3. Ensure imports are updated to point to the new location
4. Test affected functionality

## 5. Cleanup Verification Checklist

- [ ] No duplicate files remain
- [ ] Root directory contains only essential project files
- [ ] All documentation is organized in the docs folder 
- [ ] SQL files are organized in appropriate folders
- [ ] No TypeScript errors from missing imports
- [ ] Application builds successfully
- [ ] All features continue to work after cleanup 