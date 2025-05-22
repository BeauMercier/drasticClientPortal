# Project History

This document contains historical task logs, detailed implementation notes for completed features, and records of resolved issues for posterity.

## Completed Feature Details & Task Logs

### Feature: Admin Project Files View (Admin Detailed Project Page) - Completed

- **Goal:** Allow admins to see a detailed list of files associated with a project, including uploader information, original file name, and size. Initially, this will focus on displaying BIR-related files.
- **Date:** [Archived Date]
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

### Historical Task Logs

#### April 2, 2024

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

#### [Archived Date] - Settings & FileList UI

- [x] Deprecated and removed the `/client/settings` page (`src/app/(client)/client/settings/page.tsx`).
- [x] Updated `PLANNING.md` and `README.md` to remove references to the settings page.
- [x] Updated `FileList` component UI: Non-clickable "Root" title when at root level; "New Folder" functionality commented out for future use.

#### [Archived Date] - UI & Bug Fixes

- [x] **UI Fix:** Updated "Browse Files" link on Client My Profile page (`src/app/(client)/client/my-profile/page.tsx`) to correctly point to `/client/files`.
- [x] **Bug Fix:** Resolved profile photo display issue ("flashing avatar") by:
    - Correcting Supabase Storage RLS policy for public read access to avatars in the `project-files` bucket (path: `<user_id>/profile/<filename>`).
    - Ensuring `features/auth/api/index.ts -> updateProfile` returns the updated user object from `supabase.auth.updateUser()`.
    - Ensuring `AuthContext.updateProfile` uses this returned user to update its local state immediately.
- [x] **UI:** Set application favicon to `public/images/logos/Asset 1.svg` by updating `src/app/layout.tsx` metadata.

#### [Archived Date] - Auth & Redirect Fixes

- [x] **Fixed Image Previews in Gallery:** Corrected the logic in `src/components/FileList/index.tsx` to ensure actual image previews are loaded and displayed in gallery mode, not just placeholders.

#### [Archived Date] - Avatar Investigation & File Upload RLS

- [x] **Investigate and Resolve Profile Avatar Display/Save Issue**
    - **Current Understanding of Issue:** (Details of understanding archived)
- [x] **File Upload - RLS & Storage Policies:** Create migration (`..._bir_file_rls.sql`) for `bir_file` RLS and `storage.objects` policies. (User to confirm applied)
- [x] **File Upload - Type Regeneration:** (Types generated, manual code review for placeholders may be needed if issues arise)
- [x] **File Upload - BIR File Deletion:** Implemented API route `/api/bir/file/[fileId]` and updated client UI in `FileUploadStep.tsx` for deleting BIR files.

#### [Archived Date - e.g., May 17, 2024] - Client Timeline UI Enhancement - Completed

- [x] **Enhance Client-Facing Project Timeline Visuals**
    - **Goal:** Improve the visual distinction of current and completed stages on the client timeline.
    - **Requirements:**
        - Current stage icon: Blue.
        - Completed stage icons: Green.
        - Connecting bar:
            - Filled green for segments between completed stages.
            - Filled blue for the segment leading up to the current stage.
            - Unfilled/gray for segments after the current stage.
    - **Affected Component(s):** Identified and refactored the client-facing project timeline component.
    - **Tasks:**
        - [x] Located the relevant client-side timeline component.
        - [x] Updated JSX and styling (Tailwind CSS/`clsx`) to implement the new color scheme for icons and the connecting bar based on stage status (completed, current, pending).
        - [x] Ensured responsiveness and dark mode compatibility.
        - [x] Tested with various project types and stage progressions.

## Archived Feature Implementation Details

### Business Information Request (BIR) - Detailed Implementation Steps (Archived)

**Original Goal:** Replace external Zoho forms with an integrated, project-specific form within the portal for clients to provide necessary business details upon starting a **web_design** project.

**Original Implementation Strategy (Completed & Verified):**

1.  **Database & RLS (Completed & Verified):**
    *   Created `public.business_information_requests` table linked to `projects` and `profiles`.
    *   Includes `status` (enum: `pending`, `submitted`, `approved`), `answers` (jsonb), timestamps.
    *   Implemented and verified strict RLS policies (`bir_admin_all`, `bir_client_rw`, `bir_designer_read`) enforcing role-based access and the `project_type = 'web_design'` constraint. Helper functions (`get_user_role`, `is_designer_assigned_to_project`) are in place and corrected (`VOLATILE`).
    *   Created `public.bir_file` table to store metadata for BIR-specific file uploads, linked to `business_information_requests`. RLS policies implemented.
    *   Supabase Storage: Private bucket `bir-files` created for BIR file storage. RLS policies on `storage.objects` implemented for authenticated uploads.

2.  **Types & Validation Schemas (Completed & Verified):**
    *   Defined domain types and enums in `src/lib/types/bir.ts` (e.g., `BirStatus`, `BirRow`, `Bir`, `BirInsert`, `BirUpdate`). Include Supabase generated types.
    *   Defined Zod schemas for runtime validation in `src/lib/validation/bir.ts` (`birStatusSchema`, `birAnswersSchema`, `birInsertSchema`, `birUpdateSchema`). Derived DTO types.
        *   **Fields Covered:** Official Company Name, Phone, Email, Address, General Email, Website URL, Social Links (FB, IG, Other), Services Description, Company History/Mission, Team Profiles, Certs/Testimonials/Cases, Partnerships, FAQs, Specific Features, Additional Comments. (File uploads handled separately).

3.  **Low-Level Supabase API Helpers (Completed & Verified):**
    *   Created data access functions in `src/lib/api/bir.ts` (`fetchBirByProject`, `upsertBir`, `updateBir`).
    *   These functions encapsulate direct Supabase client calls (`createClient`) and use the Zod schemas for input validation.

4.  **Next.js API Route (App Router) (Completed & Verified):**
    *   Implemented a REST-ish API route at `src/app/api/bir/route.ts`.
    *   `GET /api/bir?projectId=[uuid]`: Fetches the BIR for a specific project.
    *   `POST /api/bir`: Creates/Upserts a BIR record.
    *   `PATCH /api/bir`: Updates an existing BIR record.
    *   `src/app/api/bir/upload/route.ts`: (DEPRECATED) POST for BIR file uploads. Superseded by signed URL flow.
    *   `src/app/api/bir/create-upload-url/route.ts`: POST to generate a signed URL.
    *   `src/app/api/bir/record-file/route.ts`: POST to record BIR file metadata.

5.  **Client-Side React Hooks (Completed & Verified):**
    *   Created a data fetching hook `useBir(projectId)` in `src/features/bir/useBir.ts`.

6.  **Frontend UI Components (Completed & Verified):**
    *   **Form (`src/features/bir/MultiStepBirForm.tsx`):** (Replaced old `BirForm.tsx`)
        *   Uses `react-hook-form` and `birInsertSchema`.
        *   Manages multi-step navigation, per-step validation, and submission of textual BIR data.
    *   **File Upload Tab (`src/app/(client)/client/projects/web-design/[id]/page.tsx`):**
        *   Uses `FileUploadStep.tsx` (which uses `BirFileUploader.tsx`) for BIR-specific files.
    *   **Summary (`src/features/bir/BirSummary.tsx`):**
        *   Read-only component to display BIR details.
    *   **Integration Page (`src/app/(client)/client/projects/web_design/[id]/page.tsx`):**
        *   Uses a tabbed interface for "Business Information" (`MultiStepBirForm` or `BirSummary`) and "Project Files" (`FileUploadStep`).

7.  **Testing (Partially Completed - Core functionality tested, ongoing for edge cases):**
    *   Unit tests for Zod schemas and `src/lib/api/bir.ts` helper functions.
    *   E2E tests covering the user flow.

8.  **Documentation (Completed & Verified):**
    *   Updated `README.md` and `PLANNING.MD`.

**(Initial core development layers were completed and verified. Refinements and further testing are ongoing as per TASK.MD.)**

**Archived Checklist Details from TASK.MD:**

- **Data Model & Migrations (Completed):**
    - [x] `business_information_requests` table (Supabase schema).
    - [x] `bir_file` table for uploads (Supabase schema).
    - [x] RLS policies for both tables (client write/read own, designer read assigned, admin full access).
- **Client-Side Form (`MultiStepBirForm.tsx`) (Completed):**
    - [x] Multi-step navigation (tabs/sections).
    - [x] Input fields for all BIR questions (as per `PLANNING.MD`).
        - [x] Includes "Other Social Links" text area.
    - [x] Form validation (Yup).
    - [x] Submission logic (`POST /api/bir`).
    - [x] File Upload Functionality (within relevant steps):
        - [x] Component: `BirFileUploader.tsx` (uses `src/lib/api/storage.ts` for signed URLs).
        - [x] API: `POST /api/bir/files/upload-url` (generates signed URL).
        - [x] API: `POST /api/bir/files/confirm-upload` (creates `bir_file` record).
        - [x] UI for selecting, uploading, and displaying uploaded files.
        - [x] Error handling for uploads.
        - [x] Type Regeneration: (Types generated, manual code review for placeholders may be needed if issues arise)
    - [x] Loading/success/error states.
    - [x] Save & Continue Later functionality (if applicable, or ensure clarity on submission process).


## Archived Architectural Adjustments & Bug Fixes

This section outlines significant past changes and resolutions that informed the current architecture.

### Authentication & Session Management (Archived Details)
*   **Cross-Domain Cookie Issues (Vercel Previews & Production):**
    *   **Cause:** Supabase client calls (e.g., `getUser()` in middleware) were stalling due to cookie inconsistencies between different domains.
    *   **Fix:** In `src/middleware.ts`, Supabase authentication cookies are now pinned to the root domain (`.drasticdigital.com`) to ensure they are shared across subdomains.
*   **Page Loading Hangs & "Auth session missing!":**
    *   **Cause:** Related to the cookie issues and potentially excessive Supabase client initializations.
    *   **Fixes:**
        *   `src/middleware.ts`: Implemented early returns for static assets and public paths (e.g., `/img`, `/css`, `/login`, `/register`) to avoid unnecessary Supabase client initialization and session checks on these routes.
        *   `src/features/auth/contexts/AuthContext.tsx`: The `onAuthStateChange` listener was simplified to directly use the session information provided by the Supabase event. Extra `getUser()` calls were removed.
*   **Supabase Password Reset Flow & Troubleshooting:**
    *   **Frontend Implementation Details:**
        1.  User requests reset via `PasswordResetForm.tsx`.
        2.  Client calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
            *   **`redirectTo` URL:** Hardcoded in `src/features/auth/api/index.ts` (e.g., `https://portal.drasticdigital.com/update-password`).
        3.  `AuthContext` listens for `PASSWORD_RECOVERY` event.
        4.  Context redirects to `/update-password`, cleaning URL hash.
        5.  `UpdatePasswordForm.tsx` allows new password entry.
        6.  Submission calls `supabase.auth.updateUser({ password: newPassword })`.
        7.  Successful update leads to sign out and redirect to login.
    *   **Critical Supabase Dashboard Configurations:**
        *   **URL Configuration (Authentication -> URL Configuration):**
            *   `Site URL`: Must be canonical application URL.
            *   `Additional Redirect URLs`: **MUST** contain the exact `redirectTo` URL (including localhost versions for dev). Mismatches cause 500 errors from `/auth/v1/recover`.
        *   **Email Templates (Authentication -> Email Templates -> Reset Password):**
            *   Corrupted/malformed template can cause 500 errors. Resetting to default is a key fix.
    *   **Troubleshooting Notes:**
        *   500 error `{"code":"unexpected_failure","message":"Unable to process request"}` from `/auth/v1/recover` often points to Supabase Redirect URL or email template issues.

### Navigation & Redirect Logic (Archived Details)
*   **Incorrect Redirect from Root Path (`/`):**
    *   **Problem:** Authenticated users visiting `/` redirected to generic `/dashboard`.
    *   **Cause:** `src/app/page.tsx` had unconditional redirect.
    *   **Fixes:**
        *   `src/lib/config/auth-config.ts`: Centralized `roleBasePaths`.
        *   `src/middleware.ts` & `src/app/page.tsx`: Use `roleBasePaths` for correct role-specific redirection.
*   **Redirect Loop to `/login?redirectedFrom=%2Flogin`:**
    *   **Problem:** Unauthenticated users clicking "Login" looped.
    *   **Cause:** `/login` (guest path) was inadvertently included in `authenticatedPathsPrefixes` in `src/middleware.ts`.
    *   **Fix:** `src/middleware.ts` modified to explicitly filter `/login` from protected paths. 