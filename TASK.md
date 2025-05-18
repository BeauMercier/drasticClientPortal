### Feature: Admin Project Files View (Admin Detailed Project Page)

- **Goal:** Allow admins to see a detailed list of files associated with a project, including uploader information, original file name, and size. Initially, this will focus on displaying BIR-related files.
- **Date:** [Current Date] - Placeholder, will be replaced by actual date
- [x] **API Endpoint (`/api/admin/project-files/[projectType]/[projectId]`):**
    - [x] Create a GET handler.
    - [x] Implement admin authentication/authorization.
    - [x] Fetch `client_id` and `bir_id` from `business_information_requests` based on `projectId`.
    - [x] Fetch uploader's profile (full_name, email) from `profiles` table using `client_id`.
    - [x] Fetch file details (`id`, `storage_path`, `mime_type`, `uploaded_at`, `original_name`, `size_bytes`) from `bir_file` table using `bir_id`.
    - [x] Map fetched data to `AdminProjectFile` structure (including `uploader` object and mapping `uploaded_at` to `created_at`).
    - [x] Handle cases where BIR/client/profile/files are not found.
- [x] **Frontend Component (`src/app/(admin)/admin/projects/components/ProjectFileList.tsx`):**
    - [x] Create the component to accept `projectId` and `projectType`.
    - [x] Fetch data from the new API endpoint.
    - [x] Update `AdminProjectFile` interface to include `original_name?: string | null` and `size_bytes?: number | null`.
    - [x] Display files in a list format.
    *   [x] Show `original_name` (fallback to parsed `storage_path`).
    *   [x] Show uploader's full name or email (fallback to "Unknown User").
    *   [x] Show formatted upload date (`created_at`).
    *   [x] Show formatted file size (`size_bytes`).
    *   [x] Provide a download link for each file.
    - [x] Implement loading and empty states.
- [x] **Integration:**
    - [x] Add `ProjectFileList` component to the admin detailed project view page (`src/app/(admin)/admin/projects/view/[projectId]/page.tsx`).
    - [x] Ensure `projectId` and `projectType` are correctly passed to `ProjectFileList`.
- [x] **Testing & Refinement:**
    - [x] Verify file list displays correctly with uploader name, original name, and size.
    - [x] Test error handling and edge cases (e.g., project with no BIR, project with BIR but no files, missing client profile).
- [x] **Documentation:**
    - [x] Update `PLANNING.MD` with API route and component details.
    - [x] Update `TASK.MD` with this task breakdown.

## Tasks

### April 2, 2024

- [x] Refactor client routes to use `/client` prefix and implement dedicated client sidebar
    - Moved client pages from `src/app/(client)/*` to `src/app/(client)/client/*`.
    - Created `src/app/(client)/client/page.tsx` as the main dashboard page.
    - Updated middleware expectations for client routes.
    - Created dedicated `src/components/client/ClientSidebar.tsx`, styled like `AdminSidebar`.
    - Updated `src/app/(client)/layout.tsx` to use `ClientSidebar`.
    - Fixed broken relative imports in refactored client pages.

- [x] Move `src/app/projects` route into client group (`src/app/(client)/client/projects`).
    - Fixed relative imports in `projects/page.tsx`.
    - Updated `href` paths in `projects/page.tsx` and sub-pages (`logo-design`, `social-graphics`, `web-design`) to include `/client` prefix.
- [x] Add "Projects" link to `ClientSidebar`.
- [x] ~~Implement client-side upload functionality on Web Design project detail page (`src/app/(client)/client/projects/web-design/[id]/page.tsx`).~~
    - ~~Updated `handleFileUpload` to call `/api/projects/files/upload` with `FormData`.~~
    - ~~Added toast notifications for upload status.~~
    - ~~Added placeholder `reloadProjectData` function call.~~ (Obsolete: General file upload section removed from this page, superseded by BIR-linked file uploads)

### [Current Date]

- [x] Deprecated and removed the `/client/settings` page (`src/app/(client)/client/settings/page.tsx`).
- [x] Updated `PLANNING.md` and `README.md` to remove references to the settings page.
- [x] Updated `FileList` component UI: Non-clickable "Root" title when at root level; "New Folder" functionality commented out for future use.
- TODO: Thoroughly test the new signed URL BIR file upload flow on Vercel (various file types, sizes, edge cases).

### [Current Date] - Continued

- [x] **UI Fix:** Updated "Browse Files" link on Client My Profile page (`src/app/(client)/client/my-profile/page.tsx`) to correctly point to `/client/files`.
- [x] **Bug Fix:** Resolved profile photo display issue ("flashing avatar") by:
    - Correcting Supabase Storage RLS policy for public read access to avatars in the `project-files` bucket (path: `<user_id>/profile/<filename>`).
    - Ensuring `features/auth/api/index.ts -> updateProfile` returns the updated user object from `supabase.auth.updateUser()`.
    - Ensuring `AuthContext.updateProfile` uses this returned user to update its local state immediately.
- [x] **UI:** Set application favicon to `public/images/logos/Asset 1.svg` by updating `src/app/layout.tsx` metadata.

### Discovered During Work

- TODO: Implement actual data fetching and content for `src/app/(client)/client/page.tsx`.
- TODO: Verify if pages under `/client/my-profile` (my-info, business-info) should have separate sidebar links or be accessed via tabs/sections within the `/client/my-profile` page.
- [x] ~~Update API route `/api/projects/files/upload` to insert metadata into `user_files` table after storage upload.~~ (API route itself likely still valid, but UI for this on web-design project page removed)
- TODO: Implement `reloadProjectData` function in `src/app/(client)/client/projects/web-design/[id]/page.tsx` to correctly refetch project details and BIR data.
- [x] ~~Implement API route to fetch project-specific files from `user_files` table (e.g., `/api/projects/[projectId]/user-files`), respecting RLS.~~ (API route valid, UI on web-design project page removed)
- TODO: Review how file fetching/display/download/delete should be handled for Logo Design and Social Graphics project detail pages, as the general project files section was removed from Web Design page. BIR-specific files are handled differently.
- [x] ~~Implement download functionality for project files on client detail pages (using `/api/files/url`).~~ (Removed from web-design project page UI)
- [x] ~~Implement delete functionality for project files on client detail pages (requires new API route and RLS check - user can delete own files).~~ (Removed from web-design project page UI)
- TODO: Review and refine RLS policies on `user_files` table to ensure correct access for clients, assigned designers, and admins (especially considering changes to web-design project page UI).

- [x] Update API route `/api/projects/files/upload` to insert metadata into `user_files` table after storage upload. (Backend change, still relevant)
- [x] Implement API route `/api/projects/[projectId]/user-files` to fetch project-specific files from `user_files` table, respecting RLS. (Backend change, still relevant)
- [x] Implement API route `/api/user-files/[userFileId]` to handle deletion of `user_files` record and corresponding storage object, respecting RLS. (Backend change, still relevant)
- [x] ~~Implement fetching, display, download, and delete functionality for project files (`user_files`) on Web Design project detail page.~~ (Superseded by BIR file handling in tabs on this page)
- [x] Add and refine Database RLS policies for `user_files` table (SELECT, INSERT, UPDATE, DELETE for users, admins, designers).
- [x] Add and refine Storage RLS policies for `project-files` bucket (INSERT, SELECT).
- [x] Fix infinite loop on `/client/files` page caused by `FileList` component's `useEffect` hooks.
    - Stabilized dependencies for initial load effect.
    - Prevented unnecessary state updates in preview URL effect.
- [x] Fix download functionality on `/client/files` page by correcting client-side parsing of `/api/files/url` response.

- TODO: Implement `reloadProjectData` function fully in `src/app/(client)/client/projects/web-design/[id]/page.tsx` (currently logs only, ensure it reloads BIR data for tabs).
- TODO: Re-evaluate approach for project file fetching/display/download/delete functionality for Logo Design and Social Graphics project detail pages given changes to web-design page.
- TODO: Implement the general file upload on `/client/files` page (via `FileContext`) to also insert metadata into the `user_files` table (with `project_id=NULL`).

### [Date of Current Session] - Auth & Redirect Fixes

- [x] **Resolved Page Loading/Hangs & "Auth session missing!":**
    - `src/middleware.ts`: Pinned Supabase auth cookies to `.drasticdigital.com` to fix cross-domain issues between Vercel previews and production.
    - `src/middleware.ts`: Implemented early returns for static assets/public paths to prevent unnecessary Supabase client initialization.
    - `src/features/auth/contexts/AuthContext.tsx`: Reverted `onAuthStateChange` to simpler, direct session updates from Supabase events (removed extra `getUser()` calls).
- [x] **Corrected Root Path Redirect Logic:**
    - Created `src/lib/config/auth-config.ts` to centralize `roleBasePaths` (mapping `UserRole` to redirect URLs).
    - `src/middleware.ts`: Updated to use `roleBasePaths` from the new config file and ensured `userRole` type safety.
    - `src/app/page.tsx`: Modified to use `user.role` from `useAuth()` and `roleBasePaths` to redirect authenticated users from `/` to their correct role-specific dashboards, fixing the previous redirect to a generic `/dashboard`.
- [x] **Fixed Login Redirect Loop (`/login?redirectedFrom=%2Flogin`):**
    - `src/middleware.ts`: Corrected the logic for `authenticatedPathsPrefixes` to explicitly filter out `/login` from the list of paths requiring authentication, preventing it from being treated as a path that requires prior authentication for unauthenticated users.

### Client Files UI/UX Enhancements ([Current Date])

- [x] **Cleaned up Breadcrumb:** Removed the "Root" text from the breadcrumb when viewing the top-level directory in `/client/files` (`src/components/FileList/index.tsx`).
- [x] **Default to Gallery View:** Changed the default view mode in `src/components/FileList/index.tsx` to "gallery" (icon view) instead of "list".
- [x] **Fixed Image Previews in Gallery:** Corrected the logic in `src/components/FileList/index.tsx` to ensure actual image previews are loaded and displayed in gallery mode, not just placeholders.

### UI Component Enhancements

- [x] **Project Timeline Refactor ([Current Date]):** Comprehensively refactored `src/components/projects/ProjectTimeline.tsx` based on detailed specification.
    - Updated JSDoc within the component.
    - Updated `PLANNING.MD` with the new specification details.
    - Ensured visual rules (dot/bar colors), status algorithm (completed, active, pending based on `currentStageKey`), color palette, and responsive layout (desktop/mobile) align with the spec.

### [New Date - e.g., April 4, 2024] - Avatar Investigation

- [ ] **Investigate and Resolve Profile Avatar Display/Save Issue**
    - **Current Understanding of Issue:**
        - Avatars are stored in Supabase Storage, `project-files` bucket, path: `<user_id>/profile/<filename>`.
        - `avatar_url` is present in the `profiles` table and `auth.users.user_metadata`.
        - URLs in database records appear correct (full public URLs) after an attempted update.
        - `AuthContext` manages user state including `avatar_url`.
        - **Problem:** Avatar initially loads on the profile page but then disappears, or doesn't persist visually after an update attempt, despite database records showing the correct URL.
    - **Next Steps:**
        - Verify client-side state updates in `AuthContext` upon profile update.
        - Inspect network requests related to avatar loading and any potential 403/404 errors after initial load.
        - Review RLS policies on `project-files` bucket for avatar paths specifically (ensure public read access is correctly configured if intended, or signed URLs are used consistently).
        - Check for any race conditions or timing issues in how the avatar URL is set and then used by image components.
        - Ensure the Supabase client (especially `storage.from(...).getPublicUrl()`) behaves as expected and the URL doesn't change unexpectedly.

### Feature: Business Information Request (BIR)

*This feature replaces the external Zoho form with an integrated, project-specific form.*

- [x] **Refactor: Convert BIR to Multi-Step Form** (Current Date - as per PLANNING.md)
    - [x] Create directory `src/features/bir/steps/`. (Done)
    - [x] Define `birStepConfig.ts` (optional, for step definitions). (Done)
    - [x] Create individual step components (e.g., `OfficialInfoStep.tsx`, `ContactPresenceStep.tsx`, etc.). (Done: OfficialInfoStep, ContactPresenceStep, CompanyDetailsStep, SupportingInfoStep, WebsiteSpecificsStep, FinalCommentsStep)
    - [x] Create `MultiStepBirForm.tsx` orchestrator.
        - [x] Implemented visual stepper UI.
        - [x] Enhanced stepper UI for better spacing and text visibility.
        - [x] Implemented logic for step navigation, per-step validation, and overall form submission.
        - [x] Implemented summary card view post-submission with "Edit" functionality.
        - [x] Ensured submitted state (summary card) persists on page reload if data exists and BIR is not approved.
        - [x] Resolved duplicate step headers by removing legends from individual step components.
    - [x] Update `BusinessInfoGate.tsx` to use `MultiStepBirForm.tsx`.
    - [x] Create `FileUploadStep.tsx`. (Done)
    - [x] Integrate `FileUploadStep.tsx` into a new tabbed UI on the Web Design project detail page (`src/app/(client)/client/projects/web-design/[id]/page.tsx`).
        - Separated BIR textual input and BIR file uploads into "Business Information" and "Project Files" tabs (formerly "BIR Project Files").
        - Updated `BusinessInfoGate.tsx` and `MultiStepBirForm.tsx` to correctly handle `mutateBir` prop from the page level.
        - Removed the separate general "Project Files" card and its upload/display logic from this page.
        - Fixed custom Tabs component (`src/components/ui/tabs.tsx`) to correctly handle `defaultValue` and render tab content.
    - [ ] Implement UI/UX enhancements (stepper validation within tabs, tab behavior, general polish). (Ongoing, tab UI implemented & fixed)
    - [ ] Clean up old `BirForm.tsx`.
    - [ ] Clean up unused file handling functions and state from `src/app/(client)/client/projects/web-design/[id]/page.tsx`.

- [x] **Planning:** Confirm final BIR field list & validations with stakeholders. ⚠
- [x] **Database:** Write migration script (`supabase/migrations/..._add_business_information_requests.sql`) for `business_information_requests` table, FKs, enum, trigger, indexes.
- [x] **Database:** Apply migration using `supabase db push` (or standard migration process).
- [x] **Database:** Implement RLS policies for `business_information_requests` (Admin, Client, Designer access) including `project_type = 'web_design'` constraint.
- [x] **Database:** Verify RLS policies work correctly using PostgREST API calls for various user roles (Admin, Client A, Client B, Designer C).
- [x] **Types:** Create `src/lib/types/bir.ts` with `BirStatus` enum, `BirRow`, `BirInsert`, `BirUpdate`, and `Bir` interface.
- [x] **Types:** Run `supabase gen types typescript --local > src/lib/database.types.ts` to update generated types.
- [x] **Backend (API Helpers):** Create `src/lib/api/bir.ts` with low-level Supabase data access functions (`fetchBirByProject`, `upsertBir`, `updateBir`).
- [x] **Backend (API Route):** Implement API route `src/app/api/bir/route.ts` with GET, POST, PATCH handlers using helpers and auth checks.
- [x] **Frontend:** Define Zod schema for BIR fields (`src/lib/validation/bir.ts`).
- [x] **Validation:** Define Zod schemas in `src/lib/validation/bir.ts` (`birStatusSchema`, `birInsertSchema`, `birUpdateSchema`) and derive DTO types.
- [x] **Frontend:** Create data fetching hook `useBir(projectId)` (`src/features/bir/useBir.ts`).
- [x] **Frontend:** Create `src/features/bir/BusinessInfoForm.tsx` component (RHF, ShadCN inputs, basic save logic). (Old form, to be cleaned up)
- [x] **Frontend:** Create `src/features/bir/BusinessInfoSummary.tsx` component (read-only view).
- [x] **Frontend:** Create `src/features/bir/BusinessInfoGate.tsx` to manage display logic (form vs. summary) based on `useBir` data and user role.
- [x] **Frontend:** Integrate `BusinessInfoGate` into the **client** web design project detail page component (`src/app/(client)/client/projects/web_design/[id]/page.tsx`).
- [x] **Frontend:** Integrate `BusinessInfoGate` into the **designer** web design project detail page component (`src/app/(designer)/designer/projects/web_design/[id]/page.tsx`) (Note: Page uses placeholder data fetching).
- [x] **QA:** Basic form submission/update verified (Client view). Data saves correctly to DB after UNIQUE constraint added.
- [x] **Build Fix:** Resolved Vercel build error caused by client components importing server-only API route files by moving shared `BirFileType` enum to `src/lib/types/bir.ts` and correcting import paths. Resolved TypeScript error in `BusinessInfoGate.tsx` by passing `mutateBir` prop to `BirForm`.

- [x] **File Upload - DB Migration:** Create `bir_file` table (`supabase/migrations/..._add_bir_file_table.sql`). (User to confirm applied)
- [x] **File Upload - API Routes (Signed URL Flow):** Created `/api/bir/create-upload-url` and `/api/bir/record-file` endpoints, deprecating old `/api/bir/upload` direct upload.
- [x] **File Upload - Client Component:** Created and refactored `BirFileUploader.tsx` to use the signed URL upload flow.
- [x] **File Upload - Form Integration:** Add `BirFileUploader` instances to `BirForm.tsx`. (Old form)
- [x] **File Upload - Summary Display:** Update `useBir` hook and `BirSummary.tsx` to fetch and display files with signed URLs.
- [x] **File Upload - RLS & Storage Policies:** Create migration (`..._bir_file_rls.sql`) for `bir_file` RLS and `storage.objects` policies. (User to confirm applied)
- [ ] **File Upload - Type Regeneration:** Regenerate Supabase types (`npx supabase gen types ...`) and remove placeholder types/casts. (User to confirm completion)
- [x] **File Upload - BIR File Deletion:** Implemented API route `/api/bir/file/[fileId]` and updated client UI in `FileUploadStep.tsx` for deleting BIR files.

- [ ] **Backend:** (Optional) Implement PATCH `/status` handler for admin/designer approval.
- [ ] **Backend:** Add unit/integration tests for the new API routes (using Jest/Vitest).
- [ ] **Frontend:** Create mutation hooks `useSaveBir()` (POST/PUT) and `useApproveBir()` (PATCH). (*Note: Basic POST/PATCH logic implemented within `BirForm.tsx` for now. Refactor into dedicated hooks if complexity increases.*)
- [ ] **Frontend:** Refine "Other Social Links" input in `BirForm.tsx`.
- [ ] **Designer Page:** Implement actual data fetching for the designer web design project detail page.
- [ ] **QA:** Test the entire flow thoroughly: form display logic, submission, validation, file handling (now using signed URLs), role-based access (client, designer, admin), mobile responsiveness.
- [ ] **UI Polishing:** Refine styles, layout, component usage (e.g., status badges), and add more specific field validation messages in `BirForm.tsx`.
- [x] **Documentation:** Update `PLANNING.md` with details about the BIR signed URL file upload feature.
- [x] **Documentation:** Update `TASK.MD` to reflect BIR signed URL file upload implementation.
- [ ] **Documentation:** Update `README.md` with details about the BIR signed URL file upload feature (if applicable).
- [ ] **Documentation:** Update onboarding guides for clients explaining the new process.
- [ ] **Deployment:** Consider releasing behind a feature flag (`NEXT_PUBLIC_ENABLE_BIR=true`).
- [ ] **Notifications (Optional):** Implement Edge Function/Realtime listener to notify relevant users on BIR submission.

- [x] **Fix Billing Page "Coming Soon" Overlay Stacking Order**
    - **Problem:** The "Coming Soon" overlay on `/client/billing` was rendering above the header's notification dropdown.
    - **Cause:** Overlay (`z-40`, effectively `position:fixed`), Header (`z-auto`), Notification dropdown (`z-10`).
    - **Solution (Option B - Lift dropdown):**
        - `src/shared/ui/layout/Header/NotificationsMenu.tsx`: Changed notification dropdown `div` z-index from `z-10` to `z-60`.
        - `src/shared/ui/layout/Header.tsx`: Set main `<header>` element z-index to `z-50`.
    - **Outcome:** Ensured stacking order `Dropdown (z-60) > Header (z-50) > ComingSoon Overlay (z-40)`. Header notifications now correctly appear above the overlay.

### Project Timeline/Stage Tracker Redesign - Upgrade Plan

**Phase 1: Unify Source of Truth & Backend Updates**
- [ ] **Database:**
    - [x] Define `current_stage` (enum based on `ProjectStage` type) + per-stage date columns as authoritative for stage state.
    - [x] Investigate and confirm how `current_stage` is currently populated and if it needs backfilling (e.g., from `stage varchar(50)` or `*_date` columns).
    - [ ] Plan deprecation of boolean `*_completed` flags for UI purposes. (Note: Schema review indicates these specific booleans like `discovery_completed` do not exist on project-specific tables, this task may be N/A or refer to other booleans if any are used for stage tracking).
- [ ] **Migrations:**
    - [x] Create/Update migration script to back-fill `current_stage` for existing rows on relevant project tables (`web_design_projects`, `logo_design_projects`, `social_graphics_projects`) using clarified logic. (User-provided logic applied)
    - [x] Add NOT NULL + CHECK constraints to `current_stage` on project tables (`web_design_projects`, `logo_design_projects`, `social_graphics_projects`).
- [x] **Admin API (`/api/admin/projects/update-stage`):**
    - [x] Review and ensure this is the primary write path for stage progression.
    - [x] Document that any other project update routes (if still used) should not modify stage-related boolean flags directly (Achieved by noting in PLANNING.md that update-stage is the sole route for stage changes).
- [ ] **BIR Submission API (`/api/bir/...`):**
    - [x] Modify `src/lib/api/bir.ts` (`upsertBir`) to set BIR status to 'submitted' upon creation/upsert.
    - [x] Modify `src/app/api/bir/route.ts` (POST handler) to update `web_design_projects.current_stage` to 'discovery' and set `web_design_projects.discovery_date` when a BIR is successfully submitted.
    - [x] Confirm no direct writes to legacy boolean `*_completed` stage flags from this API (Verified: API does not write to non-existent flags).

**Phase 2: Frontend Refactoring**
- [ ] **Data Hook:**
    - [x] Create `useProject(projectId)` hook (using SWR or React Query) to fetch project data, returning `{ project, error, isLoading, mutate }`.
- [ ] **Stage Logic (`WebDesignProjectDetails` page):**
    - [ ] Replace `getCurrentStageIndex` logic to use `project.current_stage` and `PROJECT_STAGES.findIndex()`.
    - [ ] Align `PROJECT_STAGES` constant (keys and potentially labels) with the `ProjectStage` enum values used in `current_stage`.
- [ ] **Cleanup (`WebDesignProjectDetails` page):**
    - [ ] Remove unused state related to boolean-file logic (e.g., `projectUserFiles` if fully superseded by BIR files for this page).
    - [ ] Remove unused handler functions for general file uploads if they are confirmed obsolete for this page (e.g., `handleFileUpload`, `fetchProjectUserFiles`, `handleDownloadFile`, `handleDeleteFile` if they only pertained to the removed general files section).

**Phase 3: Build Connected Progress Bar UI**
- [ ] **Implement JSX for Timeline:**
    - [ ] Integrate the proposed JSX structure for the connected progress bar into `WebDesignProjectDetails` (or a new `ProjectTimeline` component).
    - [ ] Ensure dynamic styling (Tailwind CSS `clsx`) works correctly for active, done, and pending states.
    - [ ] Verify dark mode compatibility.

**Phase 4: Implement Real-time Refresh**
- [ ] **Choose Strategy:** Decide between SWR revalidation enhancements or Supabase Realtime.
- [ ] **Implement SWR Revalidation (if chosen):**
    - [ ] Call `mutate()` (from `useProject`) on relevant client actions (e.g., after BIR submission if that page uses the hook).
    - [ ] Configure `revalidateOnFocus: true` and `refreshInterval` for the `useProject` hook.
- [ ] **Implement Supabase Realtime (if chosen):**
    - [ ] Create a Supabase channel subscription for project changes (`projects:id=eq.${projectId}`).
    - [ ] On `postgres_changes` events, call `mutate()` (from `useProject`) to refresh data.

**Phase 5: Accessibility & Testing**
- [ ] **Accessibility (ARIA):**
    - [ ] Add `role="progressbar"` to the timeline wrapper.
    - [ ] Implement `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on the progressbar role.
    - [ ] Ensure `aria-current="step"` is applied to the active stage dot/label.
- [ ] **Unit/Integration Tests (Jest/RTL):**
    - [ ] Create tests for the new timeline rendering at different stages.
    - [ ] Assert correct ARIA attributes for each stage.
- [ ] **Storybook (Optional but Recommended):**
    - [ ] Create a Storybook story for the timeline component.
    - [ ] Add controls to manipulate the current stage and toggle dark/light mode.

**Phase 6: Clean-up, Deprecation & Documentation**
- [ ] **Code Cleanup:**
    - [ ] Remove reads of legacy boolean `*_completed` flags from `WebDesignProjectDetails` (after frontend logic uses `current_stage`).
    - [ ] Confirm deletion of unused file handling functions/state from `WebDesignProjectDetails` (as per Phase 2 cleanup).
- [ ] **Database:**
    - [ ] Add `DEPRECATED` comments to the legacy boolean `*_completed` columns in SQL schema.
- [ ] **Documentation:**
    - [ ] Update `PLANNING.md` to reflect the new `

### [Current Date - May 17, 2024] - Client Timeline UI Enhancement

- [ ] **Enhance Client-Facing Project Timeline Visuals**
    - **Goal:** Improve the visual distinction of current and completed stages on the client timeline.
    - **Requirements:**
        - Current stage icon: Blue.
        - Completed stage icons: Green.
        - Connecting bar:
            - Filled green for segments between completed stages.
            - Filled blue for the segment leading up to the current stage.
            - Unfilled/gray for segments after the current stage.
    - **Affected Component(s):** Identify and refactor the client-facing project timeline component (likely within `src/app/(client)/client/projects/...` or a shared component it uses).
    - **Tasks:**
        - [ ] Locate the relevant client-side timeline component.
        - [ ] Update JSX and styling (Tailwind CSS/`clsx`) to implement the new color scheme for icons and the connecting bar based on stage status (completed, current, pending).
        - [ ] Ensure responsiveness and dark mode compatibility.
        - [ ] Test with various project types and stage progressions.

### [New Date - Add Today's Date Here] - BIR & Project Detail UI Refinements

- [x] **BIR Submission Status Bug Fix:** Ensured `handleSubmitAllAnswers` in `MultiStepBirForm.tsx` explicitly sends `status: 'submitted'` on final submission for both POST and PATCH.
- [x] **Web Design Project Detail Page UI - Title Display:**
    - Fixed missing project title in timeline `CardTitle` by using `project.title` (discovered from DB) instead of `project.name` in `src/app/(client)/client/projects/web-design/[id]/page.tsx`.
    - Used `project.title` for the main page H1 as well.
- [x] **Web Design Project Detail Page UI - Layout & Duplicate Title:**
    - Removed main `<header>` (H1, client/due date) from the page.
    - Increased `CardTitle` font size in timeline card to `text-2xl`.
- [x] **Web Design Project Detail Page UI - Client/Due Date Display:**
    - Updated client name to use `project.client?.full_name`.
    - Conditionally rendered client/due date line only if both `project.client?.full_name` and `project.due_date` exist.
- [x] **Web Design Project Detail Page UI - Hide Raw Status:**
    - Removed `Badge` displaying `project.status` from `src/app/(client)/client/projects/web-design/[id]/page.tsx`.
- [x] **BIR File Uploads - Multiple Files:** Updated `BirFileUploader.tsx` to allow selection and sequential upload of multiple files for each file type category.

### [Current Date] - Admin Project Management Enhancements (Designer Assignment & Visibility)

*   **[DONE] Fixed Designer Project Visibility:**
    *   **Issue:** An assigned designer logged in but did not see the newly assigned project on their projects page, or could not view project details.
    *   **Solution:**
        *   Corrected `getDesignerAssignedProjects` in `src/lib/api/client-api.ts` to fetch from `designer_projects` table instead of `project_assignments` (for project list).
        *   Created SQL migration (`YYYYMMDDHHMMSS_fix_designer_assignment_check.sql`) to update `auth_helpers.is_designer_assigned_to_project` function to use `designer_projects` for RLS checks.
        *   Updated admin project detail API routes (e.g., `/api/admin/projects/web_design/[projectId]/route.ts`) to fetch assignments from `designer_projects`.
        *   Updated non-admin project detail API routes (e.g., `/api/projects/web_design/[projectId]/route.ts`) in `canUserAccessProject` helper and main data fetch to use `designer_projects`.
    *   **Remaining:** Apply similar fixes to `/api/projects/logo_design/[projectId]/route.ts` and `/api/projects/social_graphics/[projectId]/route.ts` if they exist and follow the same pattern for fetching project details for designers/clients.
*   **[DONE] Improved "Assign Designer" Modal in Admin:**
    *   **Issue:** When an admin clicks "Assign Designer" on a project that already has a designer, the modal did not pre-select or indicate the currently assigned designer.
    *   **Solution:**
        *   Modified `/api/admin/projects/route.ts` (admin project list) to include `designer_id` in the project list data by joining with `designer_projects`.
        *   Updated `src/app/(admin)/admin/projects/page.tsx` to use the `designer_id` to pre-select the assigned designer in the modal.

### [Insert Current Date Here - e.g., April 5, 2024] - Client Projects Page Enhancement

- [x] **Enhanced Client Projects Page Navigation:** Updated the client projects category page (`src/app/(client)/client/projects/page.tsx`) to improve user experience.
    - Implemented `getClientProjectsForCategories` function in `src/lib/api/client-api.ts` to fetch project counts for the authenticated client across all categories (web design, logo design, social graphics).
    - The page now dynamically adjusts navigation: if a client has only one project within a specific category, clicking that category card will navigate directly to that project's detail page.
    - If a client has zero or multiple projects in a category, clicking the card links to the standard list page for that project category.
    - Ensured `projectCategories` in `page.tsx` uses distinct `id` (for data lookup, e.g., `web_design`) and `slug` (for URL routing, e.g., `web-design`) properties to correctly interact with fetched data and Next.js file-based routing.

### [Current Date] - Client Dashboard Enhancement

- [x] **Enhance Client Dashboard (`src/app/(client)/client/page.tsx`)**
    - [x] Implemented "Active Projects" section:
        - [x] Fetches data from `/api/client/active-projects`.
        - [x] Displays a single project with `ProjectTimeline` or multiple projects as cards.
        - [x] Correctly resolved API issues related to `thumbnail_url` and `titleField` selection.
        - [x] Resolved linter error (`Type 'void' is not assignable to type 'ReactNode'`) by removing a `console.log` from the render output in the Active Projects section.
    - [x] Implemented "Quick Links" section:
        - [x] Derived links from "My Profile" page.
        - [x] Styled links with theme-aware colors (light/dark mode support for background, text, and icons).
        - [x] Updated "Support" link to external `https://drasticdigital.com/contact`.
    - [x] UI Adjustments:
        - [x] Changed header to "Hi {user's first name}!".
        - [x] Moved "Quick Links" below "Active Projects".
        - [x] Removed "Notifications" placeholder section.
    - [x] Debugged and resolved 404 issue for "View Project" button (self-resolved after `prefetch={false}` added).
    - [x] Debugged and resolved "No Active Projects" display issue by correcting API logic and Supabase column selection.
    - [x] Refined Quick Links styling for text visibility against colored backgrounds.

### Client File Management Refactor Update ([Current Date])

- [x] **API Verification (`/api/client/all-user-files`):** Confirmed that the API endpoint is functioning correctly, authenticating via Bearer token, and fetching all user-specific file/folder records from `user_files` based on RLS (`user_id = auth.uid()`). Database inspection confirms `user_id` is correctly populated, and no `NULL` `user_id` issues were found for relevant data. This resolves the previous issue of the API returning zero items and unblocks client-side file display logic.
- [/] **RLS Policy for `user_files` (Client Access):** The existing RLS policy `"Allow users to select own files"` on `user_files` table (`USING ((user_id = auth.uid()))`) has been verified as effective for client access to their own files. Review for designer/admin access might still be pending if not covered by other tasks.

### [New Date - e.g., April 4, 2024] - Avatar Investigation

- [ ] **Investigate and Resolve Profile Avatar Display/Save Issue**
    - **Current Understanding of Issue:**
        - Avatars are stored in Supabase Storage, `project-files` bucket, path: `<user_id>/profile/<filename>`.
        - `avatar_url` is present in the `profiles` table and `auth.users.user_metadata`.
        - URLs in database records appear correct (full public URLs) after an attempted update.
        - `AuthContext` manages user state including `avatar_url`.
        - **Problem:** Avatar initially loads on the profile page but then disappears, or doesn't persist visually after an update attempt, despite database records showing the correct URL.
    - **Next Steps:**
        - Verify client-side state updates in `AuthContext` upon profile update.
        - Inspect network requests related to avatar loading and any potential 403/404 errors after initial load.
        - Review RLS policies on `project-files` bucket for avatar paths specifically (ensure public read access is correctly configured if intended, or signed URLs are used consistently).
        - Check for any race conditions or timing issues in how the avatar URL is set and then used by image components.
        - Ensure the Supabase client (especially `storage.from(...).getPublicUrl()`) behaves as expected and the URL doesn't change unexpectedly.