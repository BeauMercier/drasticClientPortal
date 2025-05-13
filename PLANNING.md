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
            - `bir/`: Endpoints for Business Information Request operations.
                - `route.ts`: Handles GET, POST, PATCH for BIR text data.
                - `upload/route.ts`: Handles POST for BIR file uploads.
        - Other standard auth routes (`login`, `register`, etc.).
- `src/components/`: Reusable UI components.
    - `admin/AdminSidebar.tsx`: Dedicated sidebar for the admin section.
    - `client/ClientSidebar.tsx`: Dedicated sidebar for the client section (styled like AdminSidebar).
    - `RoleSidebar.tsx`: Sidebar component used by Designers (dynamically shows menu based on role).
    - `layout/`: Layout-related components (e.g., `DashboardLayout`).
    - `ui/`: Likely base components from shadcn/ui.
    - `BirFileUploader.tsx`: Component for uploading files related to BIR.
- `src/features/`: Feature-specific modules (e.g., `auth`).
    - `bir/`: Module for Business Information Request feature (hooks, form, summary, gate components).
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
*   **BIR-Specific Files:** Stored in a separate, private `bir-files` bucket. Metadata in `public.bir_file` table.
    *   Storage Path: `{bir_id}/{uuid}.{ext}` (within `bir-files` bucket)
    *   Database: `bir_file` table with `bir_id` (FK to `business_information_requests`), `file_type`, `original_name`, `storage_path`, `mime_type`, `size_bytes`.

### Access Control:

Access to both storage objects and the corresponding `user_files` database records is controlled primarily by Supabase Row Level Security (RLS) policies. These policies ensure users can only access their own files or files related to projects they are assigned to (if they are designers). Admins have broader access.

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
    *   `POST`: Handles project-specific file uploads. Authenticates user and associates file with project.
*   **/api/user-files/[userFileId]**
    *   `DELETE`: Deletes a specific user file record (and potentially the storage object via triggers/storage policies). Requires ownership or admin role.
*   **/api/files/url**
    *   `GET`: Generates a temporary signed URL for downloading a file from storage. Requires appropriate access rights (via RLS/policies).
*   **/api/bir?projectId=[uuid]**
    *   `GET`: Fetches BIR text data.
*   **/api/bir**
    *   `POST`: Creates/updates BIR text data.
*   **/api/bir/upload**
    *   `POST`: Handles file uploads for a specific BIR.

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
- **Business Information Request (BIR) Files**:
    - Uploaded via the BIR form integrated into web design project pages (`src/features/bir/BirForm.tsx` using `BirFileUploader.tsx`).
    - Uses the `/api/bir/upload` endpoint.
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
    *   `src/app/api/bir/upload/route.ts`: POST for BIR file uploads.

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

### Refactor: Business Information Request (BIR) - Multi-Step Form

**Goal:** Improve user experience for the BIR by converting the single-page form into a multi-step process. This will make the form less intimidating and easier to navigate.

**Phase 1: Title Redundancy (Already Addressed)**
*   The main title for the BIR section is now provided by the Card on the project detail page.
*   The redundant `<h3>` title within the `BirForm` component has been commented out.

**Phase 2: Refactor `BirForm.tsx` into `MultiStepBirForm.tsx`**

1.  **Directory for Step Components**:
    *   A new directory will be created: `src/features/bir/steps/`.

2.  **Step Configuration (Optional but Recommended)**:
    *   Consider creating a configuration file (e.g., `src/features/bir/birStepConfig.ts`).
    *   This file would export an array or object defining each step:
        *   `id`: Unique identifier (e.g., 'officialInfo').
        *   `title`: User-friendly title for the step (e.g., "Official Company Information").
        *   `fields`: An array of `react-hook-form` field names (e.g., `'answers.official_company_name'`) relevant to this step, used for per-step validation.
        *   `component`: The React component rendering this step's UI.

3.  **Individual Step Components**:
    *   For each `<fieldset>` in the current `BirForm.tsx`, a new component will be created in `src/features/bir/steps/`. Examples:
        *   `OfficialInfoStep.tsx`
        *   `ContactPresenceStep.tsx`
        *   `CompanyDetailsStep.tsx`
        *   `SupportingInfoStep.tsx`
        *   `WebsiteSpecificsStep.tsx` (This step will initially handle only text fields).
        *   `FinalCommentsStep.tsx`
    *   Each step component will:
        *   Receive `form: UseFormReturn<FormValues>` (from `react-hook-form`) and `isSubmitting: boolean` (or similar for disabling inputs) as props.
        *   Render its specific set of input fields using `form.register` and display field-level errors.
        *   The content will be extracted from the respective `<fieldset>` in the original `BirForm.tsx`.

4.  **`MultiStepBirForm.tsx` (Orchestrator Component)**:
    *   Location: `src/features/bir/MultiStepBirForm.tsx`. This component will replace the functionality of the old `BirForm.tsx`.
    *   **Props**:
        *   `projectId: string`
        *   `mutateBir: KeyedMutator<any>` (from `useBir` hook, for triggering data revalidation)
    *   **State**:
        *   `currentStepIndex: number` (to track the active step).
        *   `isSubmittingAll: boolean` (for the final submission of all text data).
    *   **Hooks and Core Logic** (adapted from `BirForm.tsx`):
        *   `useBir(projectId)` to fetch `fetchedBir`, manage `birLoading`, `birError`.
        *   `useAuth()` for `user` details.
        *   `useForm<FormValues>` for overall form management, validation schema (`birInsertSchema`), and default values. The `useEffect` for pre-filling the form with `fetchedBir` data will reside here.
        *   `handleNextStep()`:
            *   Trigger validation for the current step's fields using `await form.trigger(fieldsForCurrentStep)`.
            *   If valid, increment `currentStepIndex`.
        *   `handlePreviousStep()`: Decrement `currentStepIndex`.
        *   `handleSubmitAllAnswers()`:
            *   This function is called when the user completes the last textual step.
            *   It will contain the API call logic (POST/PATCH to `/api/bir`) from the original `BirForm.tsx`'s `onFormSubmit`.
            *   On successful submission, it will call `mutateBir()` to refresh `fetchedBir`. This is crucial so that `fetchedBir.id` is populated, which is needed for the file upload step.
            *   After successful submission of text data, it will advance to the file upload step.
    *   **Rendering**:
        *   Display overall loading/error states.
        *   If `fetchedBir.status === 'approved'`, display the "cannot be edited" message.
        *   Dynamically render the current step's component based on `currentStepIndex` and the step configuration.
        *   Navigation UI: "Previous" and "Next" buttons. The "Next" button on the last textual step will change to "Save and Continue to File Uploads" (or similar), triggering `handleSubmitAllAnswers`.

5.  **`FileUploadStep.tsx` (New Step Component)**:
    *   Location: `src/features/bir/steps/FileUploadStep.tsx`.
    *   This step will be displayed *after* all textual BIR data has been successfully submitted and `fetchedBir.id` is available.
    *   It will receive `birId={fetchedBir.id!}` and `mutateBir` as props.
    *   It will render the `BirFileUploader` components (for Logo, Style Guide, etc.) as seen in the original `BirForm.tsx`.
    *   A "Finish" or "Complete Submission" button might be present on this step, though individual file uploads already trigger `mutateBir`.

6.  **Update `BusinessInfoGate.tsx`**:
    *   Modify `BusinessInfoGate.tsx` to import and render `<MultiStepBirForm />` instead of the old `<BirForm />` when the form is to be displayed.

7.  **UI/UX Enhancements for Multi-Step**:
    *   Implement a visual stepper component (e.g., numbered steps, progress bar) to show the user their current position in the form.
    *   Ensure clear validation messages are shown per step if "Next" is clicked with invalid data.
    *   The overall layout for each step should be more focused and less overwhelming than the current single long form.

8.  **Cleanup**:
    *   Once the multi-step form is fully functional and tested, the old `BirForm.tsx` can be safely removed or archived. 