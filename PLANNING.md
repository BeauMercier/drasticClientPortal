# Project Planning

## Goals

- **Enhance Codebase Health & Maintainability:**
    - Continue to identify and remove dead/unnecessary code.
    - Refactor complex components/modules for better clarity and modularity.
    - Ensure adherence to project standards (linting, formatting, Naming Conventions).
    - Maintain up-to-date and accurate project documentation (`README.MD`, `PLANNING.MD`, `API_ARCHITECTURE.MD`, `TASK.MD`, `docs/PROJECT_HISTORY.md`).
- **Improve Developer Experience (DX):**
    - Streamline build and test processes.
    - Ensure clear and comprehensive documentation for onboarding and feature development.
    - Improve tooling and automation where possible.
- **Complete and Refine Key Features:**
    - Finalize the Business Information Request (BIR) feature, including all planned refinements and testing.
    - Complete the Project Timeline V2, including accessibility, tests, and deprecation of old schema elements.
- **Maintain Project Stability & Knowledge Transfer:**
    - Key architectural decisions and resolutions to significant past issues (e.g., authentication, session management, navigation) are documented in `docs/PROJECT_HISTORY.md` for future reference and onboarding.

## Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (some custom, see notes below)
- **Authentication:** Supabase
    - **Session Management:** The application uses an `HttpOnly` cookie-based session strategy, managed by the `@supabase/ssr` library. A singleton, SSR-aware Supabase client is initialized in `src/lib/api/client.ts` and used throughout the application to ensure a consistent and secure authentication state between the server and client.
    - **Role Handling:** User roles, originating from `public.profiles.role`, are synchronized to `auth.users.raw_app_meta_data.role` via database triggers. The Next.js middleware (`src/middleware.ts`) leverages this by reading the role directly from the JWT (`user.app_metadata.role`), enabling synchronous and robust role-based routing decisions.
- **State Management:** React Context API (e.g., `UIContext`, `AuthContext`)
- **Database:** Supabase (Database, Auth, Storage)

### Known Issues & Resolutions
- **Profile V2 Tabs Dark-Mode Styling**:
    - **Symptom**: Tab bar appeared black instead of gray and selected pill was vertically misaligned.
    - **Root Cause**: Global dark-mode overrides in `globals.css` (e.g., `.dark .bg-gray-100 { @apply bg-black; }`) conflicted with the tab list styling.
    - **Resolution**: Avoided the default `TabsList` container for V2 and used a custom wrapper div with explicit `bg-[#3a3a3a]`, `h-12`, and inner trigger heights to ensure centering. Selected state uses `#5a5a5a`.

- **Profile V2 Inline Edit Placement**:
    - **Symptom**: Edit form rendered beneath the header/avatar instead of replacing the section.
    - **Resolution**: During edit mode, the `DashboardCard` renders only `EditProfileView`, hiding header/avatar/tabs.


- **App Router Error Page**:
    - **Symptom**: Dev overlay message “missing required error components, refreshing…” and blank page.
    - **Resolution**: Added `src/app/global-error.tsx` (client component) implementing a resettable error UI. This satisfies App Router requirements and prevents blank screens.

- **Theme Consistency for V2 Pages**:
    - **Symptom**: New dashboard/profile V2 looked incorrect depending on global theme state due to aggressive global overrides.
    - **Resolution**: Set default theme to dark in `src/app/layout.tsx` and, for extra isolation, wrapped V2 pages with a local `div.dark` container.

- **Broken JSX Wrappers**:
    - **Symptom**: Build error “Unexpected token `div`. Expected jsx identifier”.
    - **Resolution**: Fixed closing tags in `src/app/client/my-profile-v2/page.tsx` and `src/app/client/new-dashboard/NewClientPage.tsx`.

- **Website Dashboard CTA Fallback**:
    - **Symptom**: CTA pointed to non-existent `/dashboard/website`.
    - **Resolution**: Updated fallback to `/client/projects/web-design`.

- **`403 Forbidden` Error on BIR "Save and Exit"**:
    - **Symptom**: Users would receive a "403 Forbidden" error when trying to save a draft of a Business Information Request (BIR), particularly for a new project where no BIR existed yet.
    - **Root Cause**: A race condition was identified in the `src/features/bir/MultiStepBirForm.tsx` component. The form's save action (`handleSaveDraft`) could be triggered before the `useAuth()` hook had finished loading the authenticated user's data. This resulted in an API call to `/api/bir` with an empty or `undefined` `client_id`.
    - **Mechanism of Failure**: The invalid payload was sent to the server, and the Supabase database's Row Level Security (RLS) policy for the `business_information_requests` table correctly rejected the `INSERT` operation because the `client_id` did not match a valid authenticated user (`auth.uid()`).
    - **Resolution**: The fix was implemented entirely on the client-side. A new state variable, `isFormLoading`, was added to the `MultiStepBirForm.tsx` component. This state is `true` while either the BIR data or the authentication data is loading. All form action buttons (Save, Next, etc.) are now disabled while `isFormLoading` is true, preventing the user from triggering the save action until all necessary data is available. This resolves the race condition and ensures a valid `client_id` is always sent.

- **BIR Multi-Step Form Premature Submission**:
    - **Symptom**: When filling out the Business Information Request (BIR) form, upon reaching the penultimate step (Step 5 of 6) and clicking "Next," the UI would briefly flash the final step before immediately submitting the entire form. This prevented users from viewing or entering information on the final step.
    - **Root Cause**: The issue stemmed from a subtle interaction within the `MultiStepBirForm.tsx` component between its structure and the `react-hook-form` library. The entire component was wrapped in a single `<form>` tag with a global `onSubmit` handler. When the "Next" button was clicked, it correctly triggered a validation for the current step's fields. Upon successful validation, it updated the state to show the final step. However, this successful validation within the context of the global `<form onSubmit...>` handler also triggered the final submission logic as an immediate side effect. This race condition between the state update and the form submission handler caused the "flash-and-auto-submit" behavior.
    - **Troubleshooting History**: Initial attempts to fix the bug were unsuccessful and resulted in broken UI styles, requiring a `git restore` to revert the faulty changes. The final, correct solution was identified after a more thorough analysis.
    - **Resolution**: A precise, two-part fix was implemented in `src/features/bir/MultiStepBirForm.tsx` to fully decouple the step navigation from the final submission action:
        1.  **Removed Global `onSubmit`**: The `onSubmit={form.handleSubmit(...)` handler was removed from the main `<form>` element. This prevented the form from ever triggering a submission implicitly.
        2.  **Explicit Submission Button**: The "Submit All Answers" button (which appears only on the final step) was modified to explicitly handle the submission. Its `type` was changed from `submit` to `button`, and its `onClick` handler was wrapped with `form.handleSubmit()`. This ensures that the final submission logic is only ever called when a user deliberately clicks that specific button, completely resolving the bug without impacting styles or other functionality.

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
            - `my-profile-v2/`: Dev-only redesigned profile at `/client/my-profile-v2` with inline edit and dashboard styling. Supports `?edit=1`.
                - `page.tsx`: Main profile page.
                - `my-info/page.tsx`: Handles display and editing of personal user information.
                - `business-info/page.tsx`: Handles display and editing of business-related information.
            - `projects/`: Handles `/client/projects` and sub-routes. The main category listing page (`page.tsx` within this directory) now dynamically links directly to a project's detail page if the client has only one project in that category; otherwise, it links to the category's project list page.
                - `web-design/[id]/page.tsx`: Web design project detail page. Features a tabbed interface for Business Information Request (textual) and BIR-specific "Project Files".
            - `billing/page.tsx`: Handles `/client/billing`.
    - `(designer)/`: Routes for designers. Uses `src/app/(designer)/layout.tsx` with `DashboardLayout` and `RoleSidebar`.
        - `designer/`: Specific designer pages (e.g., dashboard, tasks).
    - `api/`: API routes. These are server-side endpoints that handle specific backend tasks. For client-side data fetching, see `src/lib/api/client-api.ts`.
        - `admin/`: Endpoints for administrator-specific actions.
        - `bir/`: Endpoints for Business Information Request operations (text data, signed URL creation, etc.).
        - `projects/`: Project-related endpoints.
        - Other groups for auth, user files, etc.
- `src/components/`: Reusable UI components.
    - `admin/AdminSidebar.tsx`: Dedicated sidebar for the admin section.
    - `client/ClientSidebar.tsx`: Dedicated sidebar for the client section (styled like AdminSidebar).
        - Note: The "Files" navigation link has been removed from the client sidebar menu items.
    - `RoleSidebar.tsx`: Sidebar component used by Designers (dynamically shows menu based on role).
    - `layout/`: Layout-related components (e.g., `DashboardLayout`).
    - `ui/`: Base components. Includes a **custom Tabs component** (`src/components/ui/tabs.tsx`) which supports `defaultValue`. For V2 segmented tabs, a custom outer wrapper is used instead of `TabsList` to avoid dark-mode overrides.
    - `BirFileUploader.tsx`: Component for uploading files related to BIR.
- `src/features/`: Feature-specific modules (e.g., `auth`).
    - `bir/`: Module for Business Information Request feature (hooks, multi-step form, summary, gate, file upload step components).
- `src/lib/`: Core utilities, API clients, type definitions.
    - `api/`: The frontend API layer.
        - `index.ts`: The main API entry point, which exports a namespaced `api` object (e.g., `api.client`, `api.storage`).
        - `client.ts`: Initializes the singleton, SSR-aware Supabase client. **This is the heart of our data connection.**
        - `client-api.ts`: Contains the bulk of client-safe data fetching functions.
        - `storage.ts`: Contains helpers for Supabase Storage.
    - `supabase/`: Low-level Supabase client configurations and specific helper utilities, kept separate from the general `lib/api/` layer.
    - `db/`: SQL schema files, migration definitions, and utility scripts related to database setup and migrations (e.g., specific queries, enums, or constants not fitting into the ORM/API layer directly), kept separate from the general `lib/api/` layer.
    - `types/`: TypeScript type definitions.
    - `utils/`: Utility functions.
    - `config/`: Project-wide configurations.
      - `auth-config.ts`: Centralized mapping of `UserRole` to base redirect paths. Used by middleware and root page for role-based navigation.
- `src/shared/`: Code shared across features/layers.
    - `contexts/`: Shared React contexts (e.g., `UIContext`, `AuthContext`).
    - `ui/`: Shared UI components (atoms, molecules).
- `src/styles/`: Global styles.
    - Note: Dark-mode overrides can aggressively coerce grays to black. V2 components use explicit hex colors to avoid unintended overrides.
- `src/middleware.ts`: Handles authentication (cookie domain pinning, Supabase client init), route protection, and role-based redirects. It uses the user's role from the JWT (`user.app_metadata.role`, synced from `public.profiles`) for synchronous routing decisions. Manages access to public paths (e.g., `/login`, `/register`, root `/`) and protected role-specific dashboards (e.g., `/client`, `/admin`).

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

The application uses API routes for server-side logic. Key responsibilities include:
- Performing actions requiring elevated privileges (Service Role Key).
- Handling sensitive operations like creating signed URLs for file uploads.
- Encapsulating complex business logic that shouldn't live on the client.

Refer to the `src/app/api/` directory for a full list of endpoints. The primary client-facing data functions are located in `src/lib/api/client-api.ts` and exposed via `src/lib/api/index.ts`, not directly as API routes.

### Client Profile Functions (used by V2)

- `getUserProfile()` – Fetches `public.profiles` row for current user
- `updateUserProfile(updates)` – Updates profile fields (contact/business/address/avatar)
- `uploadProfilePicture(file)` – Uploads to `project-files` bucket at `{user_id}/profile/{filename}` and updates `avatar_url`

## Feature: Business Information Request (BIR)

**Goal:** Replace external Zoho forms with an integrated, project-specific form within the portal for clients to provide necessary business details upon starting a **web_design** project.

**Status & Key Components:** This feature is largely complete and stable. 
- **Client-Side:** A multi-step form (`src/features/bir/MultiStepBirForm.tsx`) guides clients through submitting textual information. File uploads are handled via a dedicated "Project Files" tab (`FileUploadStep.tsx`) on the web design project detail page, using a signed URL flow direct to Supabase Storage (`bir-files` bucket).
- **Data Storage:** Textual data is stored in `business_information_requests`; file metadata in `bir_file`.
- **Designer View:** Designers can view submitted BIR data in a read-only format (`BirReadOnlyView.tsx`).
- **Admin View:** Admins can view submitted BIR files via `ProjectFileList.tsx` on the project detail page. They can also approve or request changes to a submitted BIR via interactive buttons in `AdminBirDetailsView.tsx`.
- **API Endpoints:** Key routes include `/api/bir` (for text data) and `/api/bir/create-upload-url`, `/api/bir/record-file` (for file uploads). The status is managed via `/api/admin/bir/[birId]/status`.

**(Initial core development was completed and verified. Detailed implementation steps from the original strategy and subsequent refactors are archived in `docs/PROJECT_HISTORY.md`. Ongoing refinements and testing are tracked in `TASK.MD`.)**

### Refactor: Business Information Request (BIR) - Multi-Step Form

**Goal:** Improve user experience for the BIR by converting the single-page form into a multi-step process. This will make the form less intimidating and easier to navigate.

**Status: Largely complete.** UI refactored into a tabbed interface on the web design project detail page. Textual BIR form is multi-step. File uploads are handled in a dedicated tab linked to the BIR.

Key aspects of this refactor included:
1.  **Directory for Step Components**: `src/features/bir/steps/`.
2.  **Step Configuration**: `src/features/bir/birStepConfig.ts`.
3.  **Individual Step Components**: For textual information.
4.  **`MultiStepBirForm.tsx`**: Orchestrator component for textual data.
5.  **`FileUploadStep.tsx`**: For BIR file uploads.
6.  **Tabbed UI Integration**: In `src/app/(client)/client/projects/web_design/[id]/page.tsx`.

**(Detailed original implementation steps are archived in `docs/PROJECT_HISTORY.md`.)**

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