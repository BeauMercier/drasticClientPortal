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

- [x] Implement actual data fetching and content for `src/app/(client)/client/page.tsx`.
- [ ] Verify if pages under `/client/my-profile` (my-info, business-info) should have separate sidebar links or be accessed via tabs/sections within the `/client/my-profile` page.
- TODO: Review how file fetching/display/download/delete should be handled for Logo Design and Social Graphics project detail pages, as the general project files section was removed from Web Design page. BIR-specific files are handled differently.
- TODO: Review and refine RLS policies on `user_files` table to ensure correct access for clients, assigned designers, and admins (especially considering changes to web-design project page UI).
- TODO: Implement `reloadProjectData` function fully in `src/app/(client)/client/projects/web-design/[id]/page.tsx` (currently logs only, ensure it reloads BIR data for tabs).
- TODO: Investigate usage of API route /api/projects/[projectId]/user-files/. Determine if it's still actively used after removal of /client/files page, or if its functionality is superseded by other BIR/admin file APIs. Document or deprecate accordingly.

### [Date of Current Session] - Auth & Redirect Fixes

- [x] **Fixed Image Previews in Gallery:** Corrected the logic in `src/components/FileList/index.tsx` to ensure actual image previews are loaded and displayed in gallery mode, not just placeholders.

### UI Component Enhancements

### [New Date - e.g., April 4, 2024] - Avatar Investigation

- [x] **Investigate and Resolve Profile Avatar Display/Save Issue**
    - **Current Understanding of Issue:**
- [x] **File Upload - RLS & Storage Policies:** Create migration (`..._bir_file_rls.sql`) for `bir_file` RLS and `storage.objects` policies. (User to confirm applied)
- [x] **File Upload - Type Regeneration:** (Types generated, manual code review for placeholders may be needed if issues arise)
- [x] **File Upload - BIR File Deletion:** Implemented API route `/api/bir/file/[fileId]` and updated client UI in `FileUploadStep.tsx` for deleting BIR files.

### [Current Date - May 17, 2024] - Client Timeline UI Enhancement

- [x] **Enhance Client-Facing Project Timeline Visuals**
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
        - [x] Locate the relevant client-side timeline component.
        - [x] Update JSX and styling (Tailwind CSS/`clsx`) to implement the new color scheme for icons and the connecting bar based on stage status (completed, current, pending).
        - [x] Ensure responsiveness and dark mode compatibility.
        - [x] Test with various project types and stage progressions.

### Feature: Business Information Request (BIR) - (Client & Designer Forms, Admin View)

- **Goal:** Create a comprehensive multi-step form for clients to submit business information, allow designers to view this information, and enable admins to manage/review it.
- **Status:** Ongoing refinements. Core functionality for client submission and designer view is in place. Admin view of submitted files is implemented.
- **Key Components:**
    - `MultiStepBirForm.tsx` (Client-facing form)
    - `BirReadOnlyView.tsx` (Designer view)
    - `src/app/(admin)/admin/projects/components/ProjectFileList.tsx` (Admin view of files)
- **Data:** Stored in `business_information_requests` and `bir_file` tables.

**Overall BIR Feature Checklist:**
- [x] **Data Model & Migrations:**
    - [x] `business_information_requests` table (Supabase schema).
    - [x] `bir_file` table for uploads (Supabase schema).
    - [x] RLS policies for both tables (client write/read own, designer read assigned, admin full access).
- [x] **Client-Side Form (`MultiStepBirForm.tsx`):**
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
- [ ] **Designer View (`BirReadOnlyView.tsx`):**
    - [x] Fetch BIR data for a given project (`GET /api/designer/bir/[projectId]`).
    - [x] Display all submitted information in a read-only format.
    - [x] Display uploaded files with download links.
    - [ ] Placeholder for "Other Social Links" if not already displayed.
- [x] **Admin View (File List):**
    - [x] Integrated into `src/app/(admin)/admin/projects/view/[projectId]/page.tsx` via `ProjectFileList.tsx`.
    - [x] Fetches and displays files from `bir_file` linked to the project.
- [ ] **API Endpoints:**
    - [x] `POST /api/bir` (Client: submit/update BIR).
    - [x] `GET /api/bir/[projectId]` (Client: get own BIR data - might be implicitly handled by page load).
    - [x] `POST /api/bir/files/upload-url` (Client: get signed URL).
    - [x] `POST /api/bir/files/confirm-upload` (Client: confirm upload, create DB record).
    - [x] `GET /api/designer/bir/[projectId]` (Designer: get BIR data for assigned project).
    - [x] `GET /api/admin/project-files/[projectType]/[projectId]` (Admin: get BIR files - already covered by Admin Project Files View).
- [ ] **Refinements & TODOs:**
    - [ ] Consider if `NEXT_PUBLIC_ENABLE_BIR` feature flag is still needed or if BIR is always on. (User confirmed not implemented, task can be removed or marked as not applicable).
    - [x] Cleanup: Remove old `BirForm.tsx` (confirmed done).
    - [x] Cleanup: Remove general file handling from `

1.  **`README.MD` Update:**
    *   [x] Review Feature List:
2.  **`PLANNING.MD` Update:**
    *   [x] Review Project Goals: Ensure they align with current project direction.
    *   [x] Review Architecture Section: