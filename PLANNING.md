# Project Planning

## Goals

- **Enhance Codebase Health & Maintainability:**
    - Continue to identify and remove dead/unnecessary code.
    - Refactor complex components/modules for better clarity and modularity.
    - Ensure adherence to project standards (linting, formatting, Naming Conventions).
    - Maintain up-to-date and accurate project documentation (`README.MD`, `PLANNING.MD`, `API_ARCHITECTURE.MD`, `TASK.MD`).
- **Improve Developer Experience (DX):**
    - Streamline build and test processes.
    - Ensure clear and comprehensive documentation for onboarding and feature development.
    - Improve tooling and automation where possible.
- **Complete and Refine Key Features:**
    - Finalize the Business Information Request (BIR) feature, including all planned refinements and testing.
    - Complete the Project Timeline V2, including accessibility, tests, and deprecation of old schema elements.

## Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (some custom, see notes below)
- **Authentication:** Supabase
- **State Management:** React Context API (e.g., `UIContext`, `AuthContext`)
- **Database:** Supabase (Database, Auth, Storage)

### Project Stage Management

- **Authoritative Source of Truth:** The `projects.current_stage` column (TEXT type, constrained to values from the `ProjectStage` type defined in `src/lib/types/project.ts`, e.g., 'discovery', 'concept-development') and the individual `projects.[stage_name]_date` columns (e.g., `projects.discovery_date`, `projects.concept_development_date`) are the definitive source for a project's current stage and progression.
- **Deprecation of Boolean Flags:** The set of boolean flags on the `projects` table (e.g., `discovery_completed`, `initial_design_completed`, `revisions_completed`, `approval_completed`, `delivery_completed`, and `business_info_submitted` as it pertains to stage completion) are to be deprecated for the purpose of calculating the current stage in the UI. 
    - During a transitional period, these boolean flags might be kept in sync with `current_stage` via database triggers or generated columns to prevent breaking other parts of the application that might still read them.
    - The long-term goal is to phase out reliance on these boolean flags for stage determination in favor of the `current_stage` text field and its corresponding date.
    - Frontend components, particularly the project timeline/stage tracker, will be refactored to derive stage information directly from `project.current_stage`.

### Directory Structure

- `src/app/`: Main application routes using Next.js App Router.
    - `(admin)/`: Routes for administrators. Uses `src/app/(admin)/layout.tsx` with `AdminSidebar`.
        - `admin/`: Specific admin pages (e.g., user management).
    - `(client)/`: Route group for client-facing sections. Uses `src/app/(client)/layout.tsx` with `ClientSidebar`.
        - `client/`: Defines the `/client` base path.
            - `page.tsx`: Client dashboard.
                - Note: Uses `AuthContext` to display the initial welcome message with the client's name, aiming for faster perceived load times. Additional profile details for features like "Quick Links" may be fetched separately.
            - `my-profile/`: Handles `/client/my-profile`.
                - `page.tsx`: Main profile page (consolidated My Info).
                - `business-info/page.tsx`: Handles `/client/my-profile/business-info`.
            - `projects/`: Handles `/client/projects` and sub-routes. The main category listing page (`page.tsx` within this directory) now dynamically links directly to a project's detail page if the client has only one project in that category; otherwise, it links to the category's project list page.
                - `web-design/[id]/page.tsx`: Web design project detail page. Features a tabbed interface for Business Information Request (textual) and BIR-specific "Project Files".
            - `billing/page.tsx`: Handles `/client/billing`.
    - `(designer)/`: Routes for designers. Uses `src/app/(designer)/layout.tsx` with `DashboardLayout` and `RoleSidebar`.
        - `designer/`: Specific designer pages (e.g., dashboard, tasks).
    - `api/`: API routes.
        - `projects/`: Project-specific API endpoints.
            - `files/`: Endpoints for general project file operations (`upload`, etc.). (Note: UI for this removed from web-design project page).
            - `bir/`: Endpoints for Business Information Request operations.
                - `route.ts`: Handles GET, POST, PATCH for BIR text data.
                - `upload/route.ts`: (DEPRECATED) Was previously for BIR file uploads, now superseded by signed URL flow.
                - `create-upload-url/route.ts`: Handles POST to generate a signed URL for direct client-to-storage BIR file uploads.
                - `record-file/route.ts`: Handles POST to record BIR file metadata in `bir_file` table after successful client-to-storage upload.
        - `admin/`, `client/`, `user-files/`, `auth/`, `files/`: Other API route groups.
        - `env-debug/`: Internal troubleshooting API endpoints.
        - `business-profile/`: API routes related to business profiles (potentially for future use or specific admin tasks).
        - Other standard auth routes (`login`, `register`, etc.).
    - `debug-env/`: Internal troubleshooting pages/routes.
    - `management/`: Legacy admin pages, slated for removal once the v2 admin dashboard features are complete.
- `src/components/`: Reusable UI components.
    - `admin/AdminSidebar.tsx`: Dedicated sidebar for the admin section.
    - `client/ClientSidebar.tsx`: Dedicated sidebar for the client section (styled like AdminSidebar).
        - Note: The "Files" navigation link has been removed from the client sidebar menu items.
    - `RoleSidebar.tsx`: Sidebar component used by Designers (dynamically shows menu based on role).
    - `layout/`: Layout-related components (e.g., `DashboardLayout`).
    - `ui/`: Base components. Includes a **custom Tabs component** (`src/components/ui/tabs.tsx`) which was refactored to support `defaultValue` prop for uncontrolled state.
    - `BirFileUploader.tsx`: Component for uploading files related to BIR.
- `src/features/`: Feature-specific modules (e.g., `auth`).
    - `bir/`: Module for Business Information Request feature (hooks, multi-step form, summary, gate, file upload step components).
- `src/lib/`: Core utilities, API clients, type definitions.
    - `api/`: Supabase client setup and data fetching functions, representing the general API layer.
        - Added `getClientProjectsForCategories`: Fetches all project types (web, logo, social) for the currently authenticated client. Returns an object mapping project types to their counts and the ID of a single project if only one exists in that category. This is used by the client projects page to determine direct navigation.
        - `bir.ts`: API helper functions for BIR data operations.
    - `supabase/`: Low-level Supabase client configurations and specific helper utilities, kept separate from the general `lib/api/` layer.
    - `db/`: Low-level database interaction helpers (e.g., specific queries, enums, or constants not fitting into the ORM/API layer directly), kept separate from the general `lib/api/` layer.
    - `types/`: TypeScript type definitions.
    - `utils/`: Utility functions.
    - `config/`: Project-wide configurations.
      - `auth-config.ts`: Centralized mapping of `UserRole` to base redirect paths. Used by middleware and root page for role-based navigation.
- `src/shared/`: Code shared across features/layers.
    - `contexts/`: Shared React contexts (e.g., `UIContext`, `AuthContext`).
    - `ui/`: Shared UI components (atoms, molecules).
- `src/styles/`: Global styles.
- `src/middleware.ts`: Handles authentication (cookie domain pinning, Supabase client init), route protection, and role-based redirects (using `auth-config.ts`).

## UI Components

- **Sidebar:** Separate sidebars are implemented for Admin (`AdminSidebar`) and Client (`ClientSidebar`). Designers use a shared `RoleSidebar`.
- **Layout:** Standard layouts include a header and a sidebar, adjusting content margins based on sidebar state (`UIContext`).
  - **Header Stacking:** The main application header (`src/shared/ui/layout/Header.tsx`) is set to `z-50`. Components within the header that need to overlay other header content (e.g., `NotificationsMenu.tsx` dropdown, `z-60`) should use a higher z-index. This ensures header elements can correctly stack above page content and viewport-fixed overlays (like "Coming Soon" messages, typically `z-40` or lower).
- **Tabs (`src/components/ui/tabs.tsx`):** This is a **custom implementation**, not the standard Radix-based `shadcn/ui` version. It has been refactored to support the `defaultValue` prop for setting the initial active tab in an uncontrolled manner by managing its own internal state. This was crucial for fixing an issue where tab content wouldn't render.
- **Project Timeline (`src/components/projects/ProjectTimeline.tsx`):**
    - **Purpose:** Renders a visual timeline for projects, indicating current, completed, and pending stages.
    - **Visual Rules:** 
        - Dots represent stages: completed (GREEN), current/active (BLUE), pending (GRAY).
        - Connecting bars inherit the color of the stage (dot) they originate from.
        - Example: `[completed]─green─[active]─blue─[pending]─gray─[pending]`
    - **Status Algorithm:** 
        - Based on `currentStageKey` and stage order. `project.current_stage` is the source of truth.
        - Special case: The final stage, if active and has a completion date, shows as completed (all-green timeline).
        - If `currentStageKey` is not found, all stages default to 'pending'.
    - **Color Palette (Tailwind CSS - see component for exact classes):**
        - Completed: `green-600/dark:green-500` (dot, label, bar); `text-white` (icon).
        - Active: `blue-600/dark:blue-500` (dot border, icon, label, bar); `bg-blue-50` (dot bg).
        - Pending: `gray-400/dark:gray-600` (dot border, bar with 50% opacity); `bg-gray-200/dark:bg-gray-700` (dot bg); `text-gray-500/dark:text-gray-400` (icon, label).
    - **Layout:** Responsive design with an interleaved dot-bar structure for desktop and a stacked vertical layout for mobile.

## Style Guide

- Follow PEP8 for Python (if any backend code is added).
- Use TypeScript for frontend code.
- Format code using Prettier/eslint configured for the project.
- Use path aliases (`@/components`, `@/lib`, etc.) for imports.

## Constraints

- Keep file length under 500 lines where possible.
- Create tests for new features (Setup needed).

## File Management

Files are stored in a single Supabase storage bucket (`project-files`). Metadata is tracked in the `public.user_files` table.

### Storage Path Conventions:

*   **Profile Avatars:**
    *   Storage Path: `{user_id}/profile/{filename}` (within `project-files` bucket)
    *   Database Reference: `avatar_url` field in `public.profiles` table and also mirrored in `auth.users.user_metadata`. This URL is the full public URL to the avatar in Supabase Storage.
*   **General User Files (Non-Project Specific):** 
    *   These are files not tied to a specific project. The dedicated UI for managing these at `/client/files` (formerly using `FileContext`) has been removed.
    *   However, the `user_files` table can still store records for such files, typically with `project_id` set to `NULL`.
    *   Storage Path: `{user_id}/general/{optional_subfolders}/{filename}` (example path, actual uploads might use `users/{USER_ID}/files/{SANITIZED_FILENAME}` if created via other means not tied to a specific project UI).
    *   Database Record: A row is created/can exist in `user_files` with `user_id` set, and `project_id` is `NULL`.
*   **Project-Specific Files (General Context):** 
    *   These files are uploaded in the context of a particular project (e.g., assets for a Logo Design project).
    *   The primary UI for this is intended to be project detail pages (excluding Web Design, see below) or potentially a centralized file manager if `/client/files` is enhanced.
    *   Uses the `/api/projects/files/upload` endpoint.
    *   Storage Path: `{user_id}/projects/{project_type}/{project_id}/{filename}` (Path may vary based on `projectType` for organization)
    *   Database Record: A row is created in `user_files` with `user_id`, `project_id`, and `project_type` all populated.
*   **BIR-Specific Files (Web Design Projects):** Stored in a separate, private `bir-files` bucket. Metadata in `public.bir_file` table.
    *   Uploaded via the "Project Files" tab within the Web Design project detail page (`src/app/(client)/client/projects/web-design/[id]/page.tsx`), which uses `FileUploadStep.tsx`.
    *   The upload process uses a signed URL flow:
        1. Client requests a signed URL from `/api/bir/create-upload-url`.
        2. File is uploaded directly from the client to the Supabase `bir-files` bucket using the signed URL.
        3. Client sends metadata to `/api/bir/record-file` to create an entry in the `bir_file` table.
    *   This tab is specifically for files related to the Business Information Request.
    *   Storage Path: `{bir_id}/{uuid}.{ext}` (within `bir-files` bucket)
    *   Database: `bir_file` table with `bir_id` (FK to `business_information_requests`), `file_type`, `original_name`, `storage_path`, `mime_type`, `size_bytes`.

**Note on Web Design Project File Uploads:** The client-facing Web Design project detail page (`.../projects/web-design/[id]/page.tsx`) previously had a section for general project file uploads. This has been removed. File uploads for Web Design projects on this page are now handled exclusively through the "Project Files" tab, which is linked to the Business Information Request (BIR) and uses the `bir-files` bucket and `bir_file` table.

### Access Control:

Access to both storage objects and the corresponding `user_files` and `bir_file` database records is controlled primarily by Supabase Row Level Security (RLS) policies. These policies ensure users can only access their own files or files related to projects they are assigned to (if they are designers). Admins have broader access.
The RLS policies for `user_files` have been verified to correctly allow authenticated clients to select their own files (both general and project-specific) via the `user_id = auth.uid()` condition, which is fundamental for the `/api/client/all-user-files` endpoint.

**The definitive RLS policies for all tables, including `user_files` and `bir_file`, are defined in the Supabase migration files located in the `supabase/migrations/` directory. These migrations represent the incremental and authoritative changes to the database schema and security policies.**

## API Routes

Key API routes for core functionality:

*   **/api/admin/projects/**
    *   `GET`: Fetches a list of *all* projects (web, logo, social) for the admin dashboard. Adds a `type` field to each project object.
*   **/api/admin/projects/[projectType]/[projectId]/**
    *   `GET`: Fetches detailed information for a *single* project, including client details and assigned designer (if any). Requires Admin role.
    *   `PUT`: Updates a *single* project. Requires Admin role. Validates input, including `status` against allowed values. Maps frontend 'name' field to `title` for logo/social projects.
*   **/api/admin/projects/assign-designer**
    *   `POST`: Assigns a designer to a specific project. Requires Admin role. (Note: This route writes to the `designer_projects` table, which is the canonical source for designer-project assignments.)
*   **/api/admin/projects/update-stage/**
    *   `POST`: Updates the stage of a specific project (`web_design_projects`, `logo_design_projects`, or `social_graphics_projects`). Requires Admin role. This is the **sole designated route** for administrators to change a project's stage, ensuring `current_stage` and `[stage_name]_date` columns are updated consistently.
*   **/api/admin/projects/force-create**
    *   `POST`: Creates a new project, bypassing some standard checks (use with caution). Requires Admin role.
*   **/api/admin/users?role=[role]**
    *   `GET`: Fetches users based on role (e.g., 'client', 'designer'). Requires Admin role.
*   **/api/projects/[projectType]/[projectId]/**
    *   `GET`: Fetches detailed information for a *single* project viewable by clients and assigned designers. Performs authentication and authorization (checks ownership or assignment) before returning data.
*   **/api/projects/files/upload**
    *   `POST`: Handles general project-specific file uploads (not BIR-specific). Authenticates user and associates file with project in `user_files` table. (Note: The UI for this was removed from the Web Design project detail page but the API endpoint remains for other uses, e.g., other project types or `/client/files` page).
*   **/api/user-files/[userFileId]**
    *   `DELETE`: Deletes a specific user file record from `user_files` (and potentially the storage object via triggers/storage policies). Requires ownership or admin role.
*   **/api/files/url**
    *   `GET`: Generates a temporary signed URL for downloading a file from storage (handles both `user_files` and `bir_file` paths, depending on parameters/logic).
*   **/api/bir?projectId=[uuid]**
    *   `GET`: Fetches BIR text data.
*   **/api/bir**
    *   `POST`/`PATCH`: Creates/updates BIR text data.
*   **/api/bir/upload**
    *   `POST`: (DEPRECATED) Previously handled file uploads for a specific BIR. This route is no longer used for BIR file uploads due to Vercel payload limitations and has been replaced by a signed URL flow.
*   **/api/bir/create-upload-url**
    *   `POST`: Generates a signed URL for direct client upload of a BIR file to Supabase Storage. Expects `birId`, `filename`, `mime`. Returns `uploadUrl` and `objectKey`.
*   **/api/bir/record-file**
    *   `POST`: Records metadata of a BIR file in the `bir_file` table after successful direct upload to Supabase Storage. Expects `birId`, `objectKey`, `size`, `mime`, `originalName`, `fileType`.
*   **/api/admin/project-files/[projectType]/[projectId]**
    *   `GET`: Fetches a list of files associated with a specific project for the admin view. Currently, this primarily retrieves files from the `bir_file` table (linked via `business_information_requests`) for `web_design` projects. It includes uploader details (derived from the project's client) and file metadata like original name and size. **Crucially, it now generates a temporary signed `download_url` for each file, pointing to the `bir-files` (private) bucket.** Requires Admin role.

## File Management Strategy (Original - Review and Consolidate/Remove Redundancy)

// The entire "File Management Strategy (Original - Review and Consolidate/Remove Redundancy)" section, which was here, has been removed as its content was outdated and a more concise, updated version exists under the main "## File Management" section.

## Feature: Business Information Request (BIR)

**Goal:** Replace external Zoho forms with an integrated, project-specific form within the portal for clients to provide necessary business details upon starting a **web_design** project.

**Implementation Strategy:**

1.  **Database & RLS (Completed & Verified):**
    *   Created `public.business_information_requests` table linked to `projects` and `profiles`.
    *   Includes `status` (enum: `pending`, `submitted`, `approved`), `answers` (jsonb), timestamps.
    *   Implemented and verified strict RLS policies (`bir_admin_all`, `bir_client_rw`, `bir_designer_read`) enforcing role-based access and the `project_type = 'web_design'` constraint. Helper functions (`get_user_role`, `is_designer_assigned_to_project`) are in place and corrected (`VOLATILE`).
    *   Created `public.bir_file` table to store metadata for BIR-specific file uploads, linked to `business_information_requests`. RLS policies implemented.
    *   Supabase Storage: Private bucket `bir-files` created for BIR file storage. RLS policies on `storage.objects` implemented for authenticated uploads.

2.  **Types & Validation Schemas:**
    *   Define domain types and enums in `src/lib/types/bir.ts` (e.g., `BirStatus`, `BirRow`, `Bir`, `BirInsert`, `BirUpdate`). Include Supabase generated types.
    *   **[Updated]** Define Zod schemas for runtime validation in `src/lib/validation/bir.ts` (`birStatusSchema`, `birAnswersSchema`, `birInsertSchema`, `birUpdateSchema`). Derive DTO types.
        *   **Current Fields:** Official Company Name, Phone, Email, Address, General Email, Website URL, Social Links (FB, IG, Other), Services Description, Company History/Mission, Team Profiles, Certs/Testimonials/Cases, Partnerships, FAQs, Specific Features, Additional Comments. (File uploads handled separately).

3.  **Low-Level Supabase API Helpers:**
    *   **[Completed]** Create data access functions in `src/lib/api/bir.ts` (`fetchBirByProject`, `upsertBir`, `updateBir`).
    *   These functions will encapsulate direct Supabase client calls (`createClient`) and use the Zod schemas for input validation.

4.  **Next.js API Route (App Router):**
    *   **[Completed]** Implement a REST-ish API route at `src/app/api/bir/route.ts`.
    *   `GET /api/bir?projectId=[uuid]`: Fetches the BIR for a specific project. Requires authenticated user (via `requireAuth`). Authorization (project access) handled by RLS.
    *   `POST /api/bir`: Creates/Upserts a BIR record. Requires authenticated user (`requireAuth`). Uses `upsertBir` helper. Validates input (`birInsertSchema`) and enforces `client_id` from authenticated user.
    *   `PATCH /api/bir`: Updates an existing BIR record (e.g., answers or status). Requires authenticated user (`requireAuth`). Uses `updateBir` helper. Validates input (`birUpdateSchema`). Authorization (record access) handled by RLS.
    *   `src/app/api/bir/upload/route.ts`: (DEPRECATED) POST for BIR file uploads. Superseded by signed URL flow.
    *   `src/app/api/bir/create-upload-url/route.ts`: POST to generate a signed URL for direct client-to-storage BIR file uploads.
    *   `src/app/api/bir/record-file/route.ts`: POST to record BIR file metadata in `bir_file` table after successful client-to-storage upload.

5.  **Client-Side React Hooks:**
    *   Create a data fetching hook `useBir(projectId)` in `src/features/bir/useBir.ts` using `useSWR` or similar to call the `GET /api/bir` endpoint.

6.  **Frontend UI Components:**
    *   **Form (`src/features/bir/MultiStepBirForm.tsx`):** (Replaced old `BirForm.tsx`)
        *   Uses `react-hook-form` and `birInsertSchema`.
        *   Manages multi-step navigation, per-step validation, and submission of textual BIR data.
    *   **File Upload Tab (`src/app/(client)/client/projects/web-design/[id]/page.tsx`):**
        *   Uses `FileUploadStep.tsx` (which uses `BirFileUploader.tsx`) for BIR-specific files, presented in a "Project Files" tab.
    *   **Summary (`src/features/bir/BirSummary.tsx`):**
        *   Read-only component to display BIR details.
    *   **Integration Page (`src/app/(client)/client/projects/web_design/[id]/page.tsx`):
        *   Uses a tabbed interface. "Business Information" tab renders `BusinessInfoGate` (which shows `MultiStepBirForm` or `BirSummary`). "Project Files" tab renders `FileUploadStep` for BIR files.

7.  **Testing:**
    *   Implement unit tests (Vitest/Jest) for Zod schemas and `src/lib/api/bir.ts` helper functions.
    *   Implement E2E tests (Cypress) covering the user flow: client submission, designer read-only view, admin approval/view.

8.  **Documentation:**
    *   Update `README.md` with details about the BIR feature.
    *   Update this `PLANNING.md` file as development progresses.

**(Database, RLS, API Helpers, and API Route layers are complete and verified).**

### Refactor: Business Information Request (BIR) - Multi-Step Form

**Goal:** Improve user experience for the BIR by converting the single-page form into a multi-step process. This will make the form less intimidating and easier to navigate.

**Status: Largely complete.** UI refactored into a tabbed interface on the web design project detail page. Textual BIR form is multi-step. File uploads are handled in a dedicated tab linked to the BIR.

1.  **Directory for Step Components**: `src/features/bir/steps/` (created).
2.  **Step Configuration**: `src/features/bir/birStepConfig.ts` (created for textual steps).
3.  **Individual Step Components**: Created for textual information (e.g., `OfficialInfoStep.tsx`).
4.  **`MultiStepBirForm.tsx` (Orchestrator Component)**: Created and functional for textual data.
5.  **`FileUploadStep.tsx` (New Step Component)**: Created for BIR file uploads.
6.  **Tabbed UI Integration**: Implemented in `src/app/(client)/client/projects/web_design/[id]/page.tsx`.
    *   "Business Information" tab for `MultiStepBirForm` (via `BusinessInfoGate`).
    *   "Project Files" tab for `FileUploadStep` (BIR-specific files).
    *   Custom Tabs component (`src/components/ui/tabs.tsx`) fixed to handle `defaultValue` correctly.
7.  **Cleanup**: Old `BirForm.tsx` needs to be removed. Unused file handling code in `web-design/[id]/page.tsx` needs cleanup. 

## Recent Architectural Adjustments & Bug Fixes

This section outlines significant recent changes and resolutions:

### Authentication & Session Management
*   **Cross-Domain Cookie Issues (Vercel Previews & Production):**
    *   **Cause:** Supabase client calls (e.g., `getUser()` in middleware) were stalling due to cookie inconsistencies between different domains.
    *   **Fix:**
        *   In `src/middleware.ts`, Supabase authentication cookies are now pinned to the root domain (`.drasticdigital.com`) to ensure they are shared across subdomains.
*   **Page Loading Hangs & "Auth session missing!":**
    *   **Cause:** Related to the cookie issues and potentially excessive Supabase client initializations.
    *   **Fixes:**
        *   `src/middleware.ts`: Implemented early returns for static assets and public paths (e.g., `/img`, `/css`, `/login`, `/register`) to avoid unnecessary Supabase client initialization and session checks on these routes.
        *   `src/features/auth/contexts/AuthContext.tsx`: The `onAuthStateChange` listener was simplified to directly use the session information provided by the Supabase event. Extra `getUser()` calls, which were part of an earlier hypothesis for fixing avatar issues, were removed as they contributed to complexity and were not the root cause of the session hangs.
*   **Supabase Password Reset Flow & Troubleshooting:**
    *   **Frontend Implementation:**
        1.  The user requests a password reset via a form (e.g., `PasswordResetForm.tsx`).
        2.  The client calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
            *   **`redirectTo` URL:** This URL (e.g., `https://portal.drasticdigital.com/update-password`) is where the user will be sent after clicking the link in the reset email. It's crucial this is a production-ready, stable URL. It was decided to hardcode this in `src/features/auth/api/index.ts` for consistency, rather than using `window.location.origin`.
        3.  The `AuthContext` listens for the `PASSWORD_RECOVERY` event via `onAuthStateChange`.
        4.  Upon detecting `PASSWORD_RECOVERY`, the context redirects the user to the update password page (e.g., `/update-password`). The URL hash (`#access_token=...`) is also cleaned up.
        5.  The update password page (e.g., `UpdatePasswordForm.tsx`) allows the user to enter a new password.
        6.  On submission, it calls `supabase.auth.updateUser({ password: newPassword })`.
        7.  After a successful update, the user is typically signed out and redirected to the login page.
    *   **Critical Supabase Dashboard Configurations:**
        *   **URL Configuration (Authentication -> URL Configuration):**
            *   `Site URL`: Must be set to the canonical URL of the application.
            *   `Additional Redirect URLs`: **MUST** contain the exact `redirectTo` URL used in the `resetPasswordForEmail` call (e.g., `https://portal.drasticdigital.com/update-password`). Also include localhost versions (e.g., `http://localhost:3000/update-password`) for development. Mismatches here are a primary cause of 500 errors ("Unable to process request") from the `/auth/v1/recover` endpoint.
        *   **Email Templates (Authentication -> Email Templates -> Reset Password):**
            *   A corrupted or malformed "Reset Password" email template (due to invalid Liquid tags or HTML) is another common cause of 500 errors on the `/auth/v1/recover` endpoint.
            *   **Troubleshooting Step:** Resetting this template to its default and saving is a key diagnostic and resolution step.
    *   **Troubleshooting Notes:**
        *   A 500 error with `{"code":"unexpected_failure","message":"Unable to process request"}` from `/auth/v1/recover`, especially when a `curl` test works, strongly points to issues with either the Supabase Redirect URL configuration or a broken email template.
        *   The `content-length` of the `/auth/v1/recover` request can be a minor clue if it seems unexpectedly large, potentially indicating an issue with the request payload, though the Supabase JS client typically handles this correctly.

### Navigation & Redirect Logic
*   **Incorrect Redirect from Root Path (`/`):**
    *   **Problem:** Authenticated users visiting `/` were incorrectly redirected to a generic `/dashboard` instead of their role-specific path (e.g., `/client` for clients).
    *   **Cause:** `src/app/page.tsx` had a `useEffect` hook unconditionally redirecting authenticated users to `/dashboard`.
    *   **Fixes:**
        *   Introduced `src/lib/config/auth-config.ts`: This file centralizes `roleBasePaths`, which maps `UserRole` (e.g., `admin`, `client`, `guest`) to their respective base URLs (e.g., `/admin`, `/client`, `/login`).
        *   `src/middleware.ts`: Updated to import and use `roleBasePaths` from the new config file. User role (fetched from the `profiles` table) is type-checked before use.
        *   `src/app/page.tsx`: The `useEffect` hook now uses `user.role` from `useAuth()` and the centralized `roleBasePaths` to redirect users from `/` to their correct role-specific page.
*   **Redirect Loop to `/login?redirectedFrom=%2Flogin`:**
    *   **Problem:** Unauthenticated users clicking "Login" on the homepage were redirected to `/login?redirectedFrom=%2Flogin`, causing a redirect loop.
    *   **Cause:**
        *   `src/lib/config/auth-config.ts` defined `guest: '/login'`.
        *   `src/middleware.ts` derived `authenticatedPathsPrefixes` (paths requiring authentication) directly from `Object.values(roleBasePaths)`, which inadvertently included `/login` itself as a protected path.
        *   The middleware logic for unauthenticated users would then attempt to redirect access to `/login` back to `/login`.
    *   **Fix:**
        *   `src/middleware.ts`: Modified the derivation of `authenticatedPathsPrefixes` to explicitly filter out `/login` (and any other designated public paths) from the list of paths requiring authentication. 

## New Feature: Admin Project Files View

This section outlines the new feature:

### **Goal:**
Provide an admin-specific view for listing project files, currently BIR files, for a specific project.

### **Implementation Strategy:**

1. **New API Route:**
    * **/api/admin/project-files/[projectType]/[projectId]**
    *   `GET`: Fetches a list of files associated with a specific project for the admin view. Currently, this primarily retrieves files from the `bir_file` table (linked via `business_information_requests`) for `web_design` projects. It includes uploader details (derived from the project's client) and file metadata like original name and size. **Crucially, it now generates a temporary signed `download_url` for each file, pointing to the `bir-files` (private) bucket.** Requires Admin role.

2. **Frontend Component:**
    * `src/app/(admin)/admin/projects/components/ProjectFileList.tsx`: Component used in the admin detailed project view (`src/app/(admin)/admin/projects/view/[projectId]/page.tsx`) to display a list of project-associated files fetched via the `/api/admin/project-files/...` endpoint. Shows file name, uploader, upload date, and size. **Download links now use the `download_url` provided by the API, which is a signed URL for secure access.**

### **Testing:**
Implement unit tests (Vitest/Jest) for the new API route and frontend component.

### **Documentation:**
Update this `PLANNING.md` file as development progresses.

**(New API route and frontend component are complete and verified).** 