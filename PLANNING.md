# Project Planning

## Goals

- [ ] Define primary project goals.

## Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (likely, based on imports)
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
            - `projects/`: Handles `/client/projects` and sub-routes (e.g., `/client/projects/web-design/[id]`).
            - `files/page.tsx`: Handles `/client/files` (General user files via `FileContext`).
            - `billing/page.tsx`: Handles `/client/billing`.
    - `(designer)/`: Routes for designers. Uses `src/app/(designer)/layout.tsx` with `DashboardLayout` and `RoleSidebar`.
        - `designer/`: Specific designer pages (e.g., dashboard, tasks).
    - `api/`: API routes.
        - `projects/`: Project-specific API endpoints.
            - `files/`: Endpoints for project file operations (`upload`, etc.).
    - Other standard auth routes (`login`, `register`, etc.).
- `src/components/`: Reusable UI components.
    - `admin/AdminSidebar.tsx`: Dedicated sidebar for the admin section.
    - `client/ClientSidebar.tsx`: Dedicated sidebar for the client section (styled like AdminSidebar).
    - `RoleSidebar.tsx`: Sidebar component used by Designers (dynamically shows menu based on role).
    - `layout/`: Layout-related components (e.g., `DashboardLayout`).
    - `ui/`: Likely base components from shadcn/ui.
- `src/features/`: Feature-specific modules (e.g., `auth`).
- `src/lib/`: Core utilities, API clients, type definitions.
    - `api/`: Supabase client setup and data fetching functions.
    - `types/`: TypeScript type definitions.
    - `utils/`: Utility functions.
- `src/shared/`: Code shared across features/layers.
    - `contexts/`: Shared React contexts (e.g., `UIContext`, `FileContext`).
    - `ui/`: Shared UI components (atoms, molecules).
- `src/styles/`: Global styles.
- `src/middleware.ts`: Handles authentication and route protection/redirection based on user role.

## UI Components

- **Sidebar:** Separate sidebars are implemented for Admin (`AdminSidebar`) and Client (`ClientSidebar`). Designers use a shared `RoleSidebar`.
- **Layout:** Standard layouts include a header and a sidebar, adjusting content margins based on sidebar state (`UIContext`).

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
*   **Project-Specific Files:** These files are uploaded in the context of a particular project (e.g., assets for a Web Design project).
    *   Storage Path: `{user_id}/projects/{project_type}/{project_id}/{filename}`
    *   Database Record: A row is created in `user_files` with `user_id`, `project_id`, and `project_type` all populated.

### Access Control:

Access to both storage objects and the corresponding `user_files` database records is controlled primarily by Supabase Row Level Security (RLS) policies. These policies ensure users can only access their own files or files related to projects they are assigned to (if they are designers). Admins have broader access.

**The definitive RLS policies for all tables, including `user_files`, can be found in the `Full_Schema.sql` file in the workspace root.** This file provides a complete snapshot of the database schema, including RLS, functions, and triggers, whereas `supabase/migrations/` may contain incremental changes.

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
    *   `POST`: Handles project-specific file uploads. Authenticates user and associates file with project.
*   **/api/user-files/[userFileId]**
    *   `DELETE`: Deletes a specific user file record (and potentially the storage object via triggers/storage policies). Requires ownership or admin role.
*   **/api/files/url**
    *   `GET`: Generates a temporary signed URL for downloading a file from storage. Requires appropriate access rights (via RLS/policies).

## UI Components

- **Sidebar:** Separate sidebars are implemented for Admin (`AdminSidebar`) and Client (`ClientSidebar`). Designers use a shared `RoleSidebar`.
- **Layout:** Standard layouts include a header and a sidebar, adjusting content margins based on sidebar state (`UIContext`).

## Style Guide

- Follow PEP8 for Python (if any backend code is added).
- Use TypeScript for frontend code.
- Format code using Prettier/eslint configured for the project.
- Use path aliases (`@/components`, `@/lib`, etc.) for imports.

## Constraints

- Keep file length under 500 lines where possible.
- Create tests for new features (Setup needed).

## File Management Strategy

- **General User Files (`src/app/(client)/client/files`, `src/shared/contexts/FileContext`)**:
    - Handles all files uploaded by a user, stored under `<user_id>/...` in storage.
    - Uses the `user_files` database table to track metadata.
    - `user_files` table includes optional `project_id` and `project_type` for associating general uploads with projects.
- **Project-Specific Uploads (e.g., Brand Assets)**:
    - Uploaded via project detail pages (e.g., `/client/projects/web-design/[id]`).
    - Uses the `/api/projects/files/upload` endpoint.
    - Files stored under `<projectType>/<projectId>/...` in storage.
    - Metadata stored in the `user_files` table (linking `user_id`, `project_id`, `project_type`, `file_path`).
    - RLS on `user_files` controls visibility (user sees own, designer sees assigned project files, admin sees all).
- **Revision Deliverables**:
    - Handled via the `project_revisions` and `revision_files` tables.
    - `revision_files` stores metadata for files specifically part of an official revision.
    - Intended for designer submissions needing client approval.

## Feature: Business Information Request (BIR)

**Goal:** Replace external Zoho forms with an integrated, project-specific form within the portal for clients to provide necessary business details upon starting a **web_design** project.

**Implementation Strategy:**

1.  **Database & RLS (Completed & Verified):**
    *   Created `public.business_information_requests` table linked to `projects` and `profiles`.
    *   Includes `status` (enum: `pending`, `submitted`, `approved`), `answers` (jsonb), timestamps.
    *   Implemented and verified strict RLS policies (`bir_admin_all`, `bir_client_rw`, `bir_designer_read`) enforcing role-based access and the `project_type = 'web_design'` constraint. Helper functions (`get_user_role`, `is_designer_assigned_to_project`) are in place and corrected (`VOLATILE`).

2.  **Types & Validation Schemas:**
    *   Define domain types and enums in `src/lib/types/bir.ts` (e.g., `BirStatus`, `BirRow`, `Bir`, `BirInsert`, `BirUpdate`). Include Supabase generated types.
    *   Define Zod schemas for runtime validation in `src/lib/validation/bir.ts` (e.g., `birStatusSchema`, `birInsertSchema`, `birUpdateSchema`). Derive DTO types (`BirInsertDTO`, `BirUpdateDTO`).

3.  **Low-Level Supabase API Helpers:**
    *   **[Completed]** Create data access functions in `src/lib/api/bir.ts` (`fetchBirByProject`, `upsertBir`, `updateBir`).
    *   These functions will encapsulate direct Supabase client calls (`createClient`) and use the Zod schemas for input validation.

4.  **Next.js API Route (App Router):**
    *   **[Completed]** Implement a REST-ish API route at `src/app/api/bir/route.ts`.
    *   `GET /api/bir?projectId=[uuid]`: Fetches the BIR for a specific project. Requires authenticated user (via `requireAuth`). Authorization (project access) handled by RLS.
    *   `POST /api/bir`: Creates/Upserts a BIR record. Requires authenticated user (`requireAuth`). Uses `upsertBir` helper. Validates input (`birInsertSchema`) and enforces `client_id` from authenticated user.
    *   `PATCH /api/bir`: Updates an existing BIR record (e.g., answers or status). Requires authenticated user (`requireAuth`). Uses `updateBir` helper. Validates input (`birUpdateSchema`). Authorization (record access) handled by RLS.

5.  **Client-Side React Hooks:**
    *   Create a data fetching hook `useBir(projectId)` in `src/features/bir/useBir.ts` using `useSWR` or similar to call the `GET /api/bir` endpoint.

6.  **Frontend UI Components:**
    *   **Form (`src/features/bir/BirForm.tsx`):**
        *   Build a reusable form component using `react-hook-form` and the `zodResolver` with `birInsertSchema`.
        *   Prefill form with data from `useBir`.
        *   On submit, call the `POST` or `PATCH /api/bir` endpoints and update local state via `mutate` from `useBir`.
    *   **Summary (`src/features/bir/BirSummary.tsx`):**
        *   Create a read-only component to display BIR details for designers and admins.
    *   **Integration Page (`src/app/(client)/client/projects/web_design/[id]/page.tsx` or potentially a dedicated sub-route like `.../[id]/bir/page.tsx`):**
        *   Integrate the `BirForm` or `BirSummary` based on user role and BIR status, using data from `useBir`. (Consider a `BirGate.tsx` component as previously planned if logic becomes complex).

7.  **Testing:**
    *   Implement unit tests (Vitest/Jest) for Zod schemas and `src/lib/api/bir.ts` helper functions.
    *   Implement E2E tests (Cypress) covering the user flow: client submission, designer read-only view, admin approval/view.

8.  **Documentation:**
    *   Update `README.md` with details about the BIR feature.
    *   Update this `PLANNING.md` file as development progresses.

**(Database, RLS, API Helpers, and API Route layers are complete and verified).** 