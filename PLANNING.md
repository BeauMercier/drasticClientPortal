# Project Planning

## Goals

- [ ] Define primary project goals.

## Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (some custom, see notes below)
- **Authentication:** Supabase
- **State Management:** React Context API (e.g., `UIContext`, `AuthContext`)

### Directory Structure

- `src/app/`: Main application routes using Next.js App Router.
    - `(admin)/`: Routes for administrators. Uses `src/app/(admin)/layout.tsx` with `AdminSidebar`.
        - `admin/`: Specific admin pages (e.g., user management).
    - `(client)/`: Route group for client-facing sections. Uses `src/app/(client)/layout.tsx` with `ClientSidebar`.
        - `client/`: Defines the `/client` base path.
            - `page.tsx`: Client dashboard.
            - `my-profile/`: Handles `/client/my-profile`.
                - `page.tsx`: Main profile page (consolidated My Info).
                - `business-info/page.tsx`: Handles `/client/my-profile/business-info`.
            - `projects/`: Handles `/client/projects` and sub-routes.
                - `web-design/[id]/page.tsx`: Web design project detail page. Features a tabbed interface for Business Information Request (textual) and BIR-specific "Project Files".
            - `files/page.tsx`: Handles `/client/files` (General user files via `FileContext`).
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
        - Other standard auth routes (`login`, `register`, etc.).
- `src/components/`: Reusable UI components.
    - `admin/AdminSidebar.tsx`: Dedicated sidebar for the admin section.
    - `client/ClientSidebar.tsx`: Dedicated sidebar for the client section (styled like AdminSidebar).
    - `RoleSidebar.tsx`: Sidebar component used by Designers (dynamically shows menu based on role).
    - `layout/`: Layout-related components (e.g., `DashboardLayout`).
    - `ui/`: Base components. Includes a **custom Tabs component** (`src/components/ui/tabs.tsx`) which was refactored to support `defaultValue` prop for uncontrolled state.
    - `BirFileUploader.tsx`: Component for uploading files related to BIR.
- `src/features/`: Feature-specific modules (e.g., `auth`).
    - `bir/`: Module for Business Information Request feature (hooks, multi-step form, summary, gate, file upload step components).
- `src/lib/`: Core utilities, API clients, type definitions.
    - `api/`: Supabase client setup and data fetching functions.
    - `types/`: TypeScript type definitions.
    - `utils/`: Utility functions.
    - `bir.ts`: API helper functions for BIR data operations.
- `src/shared/`: Code shared across features/layers.
    - `contexts/`: Shared React contexts (e.g., `UIContext`, `FileContext`).
    - `ui/`: Shared UI components (atoms, molecules).
- `src/styles/`: Global styles.
- `src/middleware.ts`: Handles authentication and route protection/redirection based on user role.

## UI Components

- **Sidebar:** Separate sidebars are implemented for Admin (`AdminSidebar`) and Client (`ClientSidebar`). Designers use a shared `RoleSidebar`.
- **Layout:** Standard layouts include a header and a sidebar, adjusting content margins based on sidebar state (`UIContext`).
- **Tabs (`src/components/ui/tabs.tsx`):** This is a **custom implementation**, not the standard Radix-based `shadcn/ui` version. It has been refactored to support the `defaultValue` prop for setting the initial active tab in an uncontrolled manner by managing its own internal state. This was crucial for fixing an issue where tab content wouldn't render.

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

*   **General User Files:** These are files uploaded by users directly (e.g., via the `/client/files` page) and are not tied to a specific project.
    *   Storage Path: `{user_id}/general/{optional_subfolders}/{filename}`
    *   Database Record: A row is created in `user_files` with `user_id` set, but `project_id` is `NULL` and `project_type` is `'general'`.
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

**The definitive RLS policies for all tables, including `user_files` and `bir_file`, can be found in the `Full_Schema.sql` file in the workspace root or respective migration files.** This file provides a complete snapshot of the database schema, including RLS, functions, and triggers, whereas `supabase/migrations/` may contain incremental changes.

## API Routes

Key API routes for core functionality:

*   **/api/admin/projects/**
    *   `GET`: Fetches a list of *all* projects (web, logo, social) for the admin dashboard. Adds a `type` field to each project object.
*   **/api/admin/projects/[projectType]/[projectId]/**
    *   `GET`: Fetches detailed information for a *single* project, including client details and assigned designer (if any). Requires Admin role.
    *   `PUT`: Updates a *single* project. Requires Admin role. Validates input, including `status` against allowed values. Maps frontend 'name' field to `title` for logo/social projects.
*   **/api/admin/projects/assign-designer**
    *   `POST`: Assigns a designer to a specific project. Requires Admin role.
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

## UI Components (Duplicated Section - Consolidate Later if needed)

- **Sidebar:** Separate sidebars are implemented for Admin (`AdminSidebar`) and Client (`ClientSidebar`). Designers use a shared `RoleSidebar`.
- **Layout:** Standard layouts include a header and a sidebar, adjusting content margins based on sidebar state (`UIContext`).

## Style Guide (Duplicated Section - Consolidate Later if needed)

- Follow PEP8 for Python (if any backend code is added).
- Use TypeScript for frontend code.
- Format code using Prettier/eslint configured for the project.
- Use path aliases (`@/components`, `@/lib`, etc.) for imports.

## Constraints (Duplicated Section - Consolidate Later if needed)

- Keep file length under 500 lines where possible.
- Create tests for new features (Setup needed).

## File Management Strategy (Original - Review and Consolidate/Remove Redundancy)

- **General User Files (`src/app/(client)/client/files`, `src/shared/contexts/FileContext`)**:
    - Handles all files uploaded by a user, stored under `<user_id>/...` in storage.
    - Uses the `user_files` database table to track metadata.
    - `user_files` table includes optional `project_id` and `project_type` for associating general uploads with projects.
- **Project-Specific Uploads (e.g., Brand Assets)**:
    - Previously mentioned for project detail pages like `/client/projects/web-design/[id]`. This page now handles files via BIR context (see note above).
    - Other project types (logo, social graphics) might still use the `/api/projects/files/upload` endpoint directly on their detail pages.
    - Files stored under `<projectType>/<projectId>/...` in storage (path construction for this may need review).
    - Metadata stored in the `user_files` table (linking `user_id`, `project_id`, `project_type`, `file_path`).
    - RLS on `user_files` controls visibility (user sees own, designer sees assigned project files, admin sees all).
- **Revision Deliverables**:
    - Handled via the `project_revisions` and `revision_files` tables.
    - `revision_files` stores metadata for files specifically part of an official revision.
    - Intended for designer submissions needing client approval.
- **Business Information Request (BIR) Files**:
    - Uploaded via the "Project Files" tab on web design project pages (`src/app/(client)/client/projects/web-design/[id]/page.tsx` using `FileUploadStep.tsx`).
    - Uses a signed URL flow:
        1. Client requests a signed URL from `/api/bir/create-upload-url`.
        2. File is uploaded directly to the `bir-files` Supabase Storage bucket.
        3. Client notifies `/api/bir/record-file` to create metadata entry in `bir_file` table.
    - Files stored in a dedicated private Supabase Storage bucket: `bir-files`.
    - Path: `{bir_id}/{uuid}.{ext}` within the `bir-files` bucket.
    - Metadata stored in the `bir_file` table (linking to `business_information_requests.id`).
    - Access controlled by RLS on `bir_file` and `storage.objects` for the `bir-files` bucket. Downloads via signed URLs.

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