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

### UI Component Enhancements

### Feature: Business Information Request (BIR) - Remaining Tasks

- **Goal:** Create a comprehensive multi-step form for clients to submit business information, allow designers to view this information, and enable admins to manage/review it.
- **Status:** Ongoing refinements. Core functionality is in place.

**Remaining BIR TODOs:**
- **Designer View (`BirReadOnlyView.tsx`):**
    - [ ] Placeholder for "Other Social Links" if not already displayed.
- **Refinements & TODOs:**
    - TODO: Thoroughly test the new signed URL BIR file upload flow on Vercel (various file types, sizes, edge cases).

1.  **`README.MD` Update:**
    *   [x] Review Feature List:
2.  **`PLANNING.MD` Update:**
    *   [x] Review Project Goals: Ensure they align with current project direction.
    *   [x] Review Architecture Section:

### Feature: Notifications & Client Onboarding System
- **Goal:** Implement a robust notifications system to alert users to important events and guide new clients through essential onboarding steps.
- **Status:** Core functionality implemented, ongoing refinements and testing. Refer to `NOTIFICATIONS_PLAN.MD` for detailed technical implementation steps and `docs/PROJECT_HISTORY.md` for detailed troubleshooting history.
- **Date:** [Current Date - Will be replaced by actual start date]

**Implementation Tasks (High-Level - See `NOTIFICATIONS_PLAN.MD` for details):**
1.  [x] **Database Layer & Initial Triggers (Consolidated):**
    *   [x] Create and apply the consolidated SQL migration file (`YYYYMMDDHHMMSS_create_notifications_system.sql`). This covers:
        *   `notifications` table schema and indexes.
        *   RLS policies for `notifications`.
        *   Helper functions (`mark_notification_read`, `mark_all_notifications_read`).
        *   SQL trigger for new client welcome & profile completion notifications.
    *   Note: Migration file `YYYYMMDDHHMMSS_create_notifications_system.sql` still needs to be generated from the live schema and committed to `supabase/migrations/`.
2.  [x] **Server-Side Triggers / Edge Functions (Additional):**
    *   [x] Implement Edge Function `notify-project-stage` for project stage update notifications.
    *   [ ] *Consider other events that should trigger notifications (e.g., BIR submission due soon, new message from designer - to be detailed in `NOTIFICATIONS_PLAN.MD` or subsequent tasks).*
3.  [x] **Next.js API Routes (`src/app/api/notifications/`):**
    *   [x] `GET /` - List notifications for the authenticated user (with pagination).
    *   [x] `POST /[id]/read` - Mark a specific notification as read.
    *   [x] `POST /read-all` - Mark all unread notifications as read.
4.  [x] **React Hook & Components (Frontend):**
    *   [x] Create `useNotifications` hook (fetching, SWR, state management).
    *   [x] Implement/Update `NotificationsMenu.tsx` (header bell icon, dropdown list).
5.  [x] **UI Cues for Soft Walkthrough (Client Onboarding):**
    *   [x] Add dynamic badges to sidebar navigation items (e.g., for pending profile actions via `useNotifications.hasActionableNotification`).
    *   [x] Create a "Getting Started" panel/card on the client dashboard for new user action items (e.g., `GettingStartedPanel.tsx`).
6.  [x] **(Optional) Realtime Integration:**
    *   [x] Enhance `useNotifications` hook with Supabase Realtime for instant new notification updates (INSERT events).
7.  [ ] **QA & Testing:**
    *   [ ] Thoroughly test the entire notification flow (creation, display, interaction, deep-linking across various notification types).
    *   [ ] Test onboarding cues for new client users.
    *   [ ] Verify all notification types deep-link to the correct pages.
    *   [ ] Test dark mode UI for `NotificationsMenu` thoroughly after global CSS override fix.
8.  [ ] **(Optional) Guided Tour Library:**
    *   [ ] Evaluate the need for a full guided tour (e.g., `react-joyride`) post-MVP launch of notifications. Implement if deemed necessary for user experience.

**Troubleshooting & Refinements ([Current Date]):**
*   [x] **API Authentication (401 Errors):**
    *   Identified multiple Supabase client instances (client-side vs. API routes).
    *   Standardized client-side Supabase client usage in `Header.tsx` (via `useAuth`) and `useNotifications.ts` (via shared `@/lib/api/client.ts`).
    *   Resolved cookie strategy mismatch by migrating notification API routes (`/api/notifications/**`) from `@supabase/auth-helpers-nextjs` (expecting `sb-access-token`) to `@supabase/ssr` (using `supabase-auth-token` format via `createServerClient` and `nextCookies()` adapter from `src/lib/supabase/cookieAdapter.ts`). This fixed 401 errors.
*   [x] **Edge Function `notify-project-stage`:**
    *   Resolved initial 401s by ensuring webhook secret consistency (function secret vs. DB webhook header) and function redeployment after secret changes.
    *   Corrected payload parsing: Changed from `record.client_id` to `record.user_id`.
    *   Addressed issue where function exited early if `newStage === oldStage`; ensured genuine stage changes trigger notifications.
    *   Updated link generation logic to include `projectType` (derived from `body.table`) resulting in links like `/client/projects/[projectType]/[id]` to fix 404 errors.
*   [x] **UI - `NotificationsMenu.tsx`:**
    *   Addressed dark mode hover issue where text became illegible. Applied `dark:` variants for hover background and text colors.
    *   Applied a temporary workaround (`<style jsx global>`) to further address hover style issues caused by a global CSS override.
    *   **TODO**: Remove temporary `<style jsx global>` workaround from `NotificationsMenu.tsx` once the conflicting global CSS rule (`.dark .bg-gray-50 { background-color: #000 !important; }`) is removed or refactored in the project's main stylesheets.
*   [ ] **Realtime Updates for Status Changes:**
    *   Consider enhancing `useNotifications` hook's Realtime subscription to also listen for `UPDATE` events on the `notifications` table (e.g., for `status` changes from 'unread' to 'read' initiated from other tabs/devices). Currently relies on SWR polling/revalidation for this.

### Discovered During Work

- [ ] **Database Migration for Notifications**: Generate and commit the SQL migration file for the `notifications` table, related RLS policies, and helper functions (`mark_notification_read`, `mark_all_notifications_read`, `notify_new_client` trigger) to `supabase/migrations/`. The schema currently exists live but is not tracked in version-controlled migrations.