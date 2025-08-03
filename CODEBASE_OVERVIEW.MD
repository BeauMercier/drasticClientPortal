# Drastic Client Portal - Codebase Overview

## 1. Project Purpose & Core Technologies

**Purpose:**
The Drastic Client Portal is a comprehensive web application designed to streamline interactions between Drastic Digital, its clients, and its designers. It provides a centralized platform for project management, communication, file sharing, and information gathering, aiming to enhance efficiency and client experience.

**Core Technologies:**
*   **Framework:** Next.js 13+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (with some custom components)
*   **Backend & Database:** Supabase (PostgreSQL Database, Authentication, Storage)
*   **Authentication & Session Management:** Supabase Auth, managed via `@supabase/ssr` for secure, `HttpOnly` cookie-based sessions that are compatible with Next.js Server-Side Rendering (SSR).
*   **State Management:** React Context API (e.g., `UIContext`, `AuthContext`)
*   **Form Handling:** `react-hook-form` with Zod for validation
*   **Testing:** Vitest (setup present, refer to `vitest.config.ts`)

## 2. Architecture

The project follows a modular structure facilitated by Next.js and TypeScript.

### 2.1. Frontend Architecture
*   **Next.js App Router (`src/app/`):** Defines routes, pages, layouts, and API endpoints.
    *   **Route Groups:** `(admin)`, `(client)`, `(designer)` are used to organize routes and apply specific layouts (e.g., sidebars) for different user roles without affecting the URL path.
    *   **Layouts:** Root layout (`src/app/layout.tsx`) and role-specific layouts (e.g., `src/app/(admin)/layout.tsx`) manage the overall page structure.
*   **Components (`src/components/`):** Reusable UI components.
    *   `ui/`: Base components, including shadcn/ui primitives and a custom Tabs component (`src/components/ui/tabs.tsx`).
    *   Role-specific components: `admin/AdminSidebar.tsx`, `client/ClientSidebar.tsx`.
    *   Shared layout components: `layout/DashboardLayout.tsx`, `RoleSidebar.tsx`.
*   **Features (`src/features/`):** Modules for specific application features (e.g., `auth`, `bir`). These often contain feature-specific hooks, components, and types.
*   **Shared Code (`src/shared/`):** Code shared across features or layers, such as React contexts (`contexts/`) and shared UI elements (`ui/`).
*   **Utilities & Core Logic (`src/lib/`):**
    *   `api/`: The primary frontend API layer.
        *   `index.ts`: The main API entry point, which exports a namespaced `api` object (e.g., `api.client`, `api.storage`).
        *   `client.ts`: Initializes the singleton, SSR-aware Supabase client using `@supabase/ssr`. This is the core of the data layer.
        *   `client-api.ts`: Contains the bulk of client-safe data fetching functions.
        *   `storage.ts`: Contains helpers for Supabase Storage.
    *   `supabase/`: Lower-level Supabase client configurations and specific helper utilities.
    *   `db/`: SQL schema files, migration definitions (though migrations are primarily in `supabase/migrations/`), and DB-related utility scripts.
    *   `types/`: Global TypeScript type definitions.
    *   `utils/`: General utility functions.
    *   `config/`: Project-wide configurations (e.g., `auth-config.ts` for role-based redirect paths).

### 2.2. Backend/API Architecture
*   **Next.js API Routes (`src/app/api/`):** Backend handlers for various functionalities.
    *   Organized by resource or feature (e.g., `/api/projects/`, `/api/bir/`, `/api/admin/`).
    *   Handle request validation, authentication/authorization, and interaction with Supabase services.
*   **Supabase:**
    *   **Authentication:** Manages user sign-up, login, sessions, and role-based access.
    *   **Database (PostgreSQL):** Stores all application data (users, projects, files, BIR). Row Level Security (RLS) is heavily used to control data access.
    *   **Storage:** Used for file uploads (profile avatars, project files, BIR documents).

### 2.3. Key Directories Summary
*   `src/app/`: Next.js App Router (routes, pages, layouts, API endpoints).
*   `src/components/`: Reusable UI components.
*   `src/lib/`: Core logic, API clients, type definitions, utilities.
*   `src/features/`: Feature-specific modules.
*   `src/shared/`: Code shared across features (contexts, shared UI).
*   `src/styles/`: Global styles.
*   `src/middleware.ts`: Edge middleware for authentication, route protection, and role-based redirects.
*   `supabase/migrations/`: Authoritative source for database schema and RLS policies.
*   `public/`: Static assets.

## 3. Key Features & Functionality

*   **User Authentication & Roles:** Secure login with distinct roles (admin, designer, client) and role-specific dashboards/permissions.
*   **Project Management:**
    *   Admins can create, view, and manage all projects (web design, logo design, social graphics).
    *   Clients and assigned designers can view their respective projects.
    *   Project stage tracking and visual timeline.
*   **Business Information Request (BIR):** (Web Design Projects Only)
    *   An integrated, multi-step form for clients to submit business details.
    *   Includes sections for textual information and file uploads.
    *   Designers and admins can view submitted BIR data.
    *   A critical bug causing premature submission on the final step has been resolved, making the form's navigation and submission process stable and reliable.
*   **File Management:**
    *   Profile avatar uploads.
    *   General project file uploads (for non-web-design projects, or general files not tied to BIR).
    *   BIR-specific file uploads using a secure signed URL flow.
    *   Admin view for project files (initially focused on BIR files).
*   **Admin Dashboard:**
    *   User management (view users by role).
    *   Project overview and detailed project views.
    *   Assign designers to projects.
    *   Update project stages.
*   **Client Dashboard:**
    *   Overview of active projects with timelines.
    *   Quick links to relevant sections.
    *   Profile management (personal and business information).
*   **Designer Dashboard:** (Scope may vary)
    *   View assigned projects and tasks.
    *   Access submitted BIR information.
*   **Responsive UI:** Modern, responsive design using Tailwind CSS.

## 4. Authentication and Authorization

*   **Provider:** Supabase Auth.
*   **Session Handling:** The application uses `@supabase/ssr` to manage user sessions via secure, `HttpOnly` cookies. A singleton client, initialized in `src/lib/api/client.ts`, ensures consistent session state between server and client components, resolving previous hydration-related bugs.
*   **Middleware (`src/middleware.ts`):**
    *   Handles authentication checks for protected routes.
    *   Redirects users based on their role using `src/lib/config/auth-config.ts`.
    *   **Cookie Management:** Configured to pin authentication cookies to the parent domain (`.drasticdigital.com`) to ensure seamless authentication across subdomains (e.g., Vercel previews, production). This resolved significant past stability issues.
*   **Role-Based Access Control (RBAC):**
    *   User roles (`admin`, `designer`, `client`) are stored in the `profiles` table.
    *   Access to pages and API endpoints is restricted based on these roles.
*   **Row Level Security (RLS):**
    *   Extensively used in Supabase to control data access at the database level.
    *   Policies ensure users can only access their own data or data related to projects they are involved in.
    *   RLS policies are defined in `supabase/migrations/`.

## 5. Database and Data Management

*   **Database:** Supabase PostgreSQL.
*   **Key Tables:**
    *   `profiles`: User profiles, roles, and authentication IDs.
    *   `projects`: Core project information (common to all types).
    *   `web_design_projects`, `logo_design_projects`, `social_graphics_projects`: Specific details for each project type.
    *   `designer_projects`: Links designers to projects.
    *   `business_information_requests` (`bir`): Stores textual data for the BIR feature.
    *   `bir_file`: Metadata for files uploaded via the BIR feature.
    *   `user_files`: Metadata for general user files (avatars, non-BIR project files).
*   **Data Access Layer (`src/lib/api/`):**
    *   Provides a namespaced API for interacting with the Supabase database (e.g., `api.client.getProjects()`).
    *   The singleton Supabase client (`supabase`) is exported for direct use when needed.
    *   This layer abstracts away most direct database calls from the UI components.
*   **Migrations (`supabase/migrations/`):**
    *   The authoritative source for database schema changes, RLS policies, and database functions.
    *   Managed using the Supabase CLI.

### 5.1. File Management Strategy
*   **Storage Buckets:**
    *   `project-files` (Public & Private access based on RLS and paths):
        *   Profile Avatars: `{user_id}/profile/{filename}`. Publicly readable via RLS.
        *   General User/Project Files (Non-BIR): Paths like `{user_id}/projects/{project_type}/{project_id}/{filename}`. Access controlled by RLS on `user_files` and storage object policies.
    *   `bir-files` (Private):
        *   BIR-Specific Files: `{bir_id}/{uuid}.{ext}`. Accessed via signed URLs.
*   **Metadata Tables:**
    *   `user_files`: Tracks metadata for files in `project-files` (e.g., `uploader_id`, `project_id`, `storage_path`).
    *   `bir_file`: Tracks metadata for files in `bir-files` (e.g., `bir_id`, `storage_path`, `original_name`).
*   **Upload Flows:**
    *   General Files: Typically uploaded via API endpoints that handle both storage and metadata recording (e.g., `/api/projects/files/upload`).
    *   BIR Files: Use a secure **signed URL flow**:
        1.  Client requests a signed URL from `/api/bir/create-upload-url`.
        2.  File is uploaded directly from the client to the `bir-files` bucket.
        3.  Client sends metadata to `/api/bir/record-file` to create an entry in `bir_file`.
*   **Access Control:** RLS policies on both metadata tables (`user_files`, `bir_file`) and Supabase Storage objects ensure users can only access/manage appropriate files.

## 6. UI Components, Styling, and State Management

*   **Styling:** Tailwind CSS is used for utility-first styling. Global styles are in `src/styles/`.
*   **UI Component Library:** `shadcn/ui` provides a set of accessible and customizable base components.
    *   These are typically imported into `src/components/ui/`.
*   **Custom Components (`src/components/`):**
    *   **Layouts:** `AdminSidebar`, `ClientSidebar`, `RoleSidebar`, `DashboardLayout`, `Header`.
    *   **Specialized UI:** A **custom Tabs component** (`src/components/ui/tabs.tsx`) was developed to support `defaultValue` for uncontrolled state, which was crucial for tab content rendering.
    *   **Feature Components:** e.g., `BirFileUploader.tsx`, `ProjectTimeline.tsx`.
*   **State Management:**
    *   Primarily uses React Context API for global/shared state.
        *   `AuthContext` (`src/features/auth/contexts/AuthContext.tsx`): Manages user authentication state, profile information.
        *   `UIContext` (`src/shared/contexts/UIContext.tsx`): Manages UI-related state, like sidebar visibility.
    *   Local component state is managed using `useState` and `useReducer`.
    *   `react-hook-form` is used for managing form state and validation.

## 7. Important Configurations, Conventions, and Best Practices

*   **Environment Variables (`.env.local`):**
    *   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: For client-side Supabase access.
    *   `SUPABASE_SERVICE_ROLE_KEY`: For server-side admin access to Supabase.
*   **Path Aliases:** Configured in `tsconfig.json` (e.g., `@/components`, `@/lib`) for cleaner imports.
*   **File Structure & Modularity:**
    *   Organize code by feature or responsibility.
    *   Aim to keep individual file lengths manageable (ideally under 500 lines).
*   **Coding Style:**
    *   TypeScript for type safety.
    *   Code is formatted using Prettier and ESLint (see `.eslintrc.json`, `.prettierrc` if present).
*   **Type Safety:** Utilize TypeScript types extensively. Define shared types in `src/lib/types/`.
*   **API Design:** REST-ish principles for API routes in `src/app/api/`.
*   **Error Handling:** Implement proper error handling in API routes and frontend components, providing feedback to the user (e.g., using toast notifications).

## 8. Development Workflow, Testing, and Documentation

*   **Installation & Running:** Standard Node.js project (`npm install`, `npm run dev`). See `README.MD`.
*   **Testing:**
    *   Vitest is configured for unit/integration testing (`vitest.config.ts`).
    *   Tests should ideally be placed in a `/tests` directory mirroring the `src` structure.
    *   Focus on testing critical business logic, API helpers, UI components, and utility functions.
*   **Documentation:** Maintaining up-to-date documentation is crucial.
    *   `README.MD`: High-level project overview, setup, and structure.
    *   `PLANNING.MD`: Detailed architectural plans, feature specifications, style guides, constraints.
    *   `TASK.MD`: Tracks ongoing, upcoming, and recently completed tasks.
    *   `docs/PROJECT_HISTORY.MD`: Archives detailed write-ups of completed features, significant bug fixes, and historical decisions.
    *   `CODEBASE_OVERVIEW.MD` (this file): Onboarding guide for new developers.
    *   Code comments for non-obvious logic.
    *   Docstrings for functions (Google style preferred for consistency if Python was also in stack, adapt for TS/JS).

## 9. Recent Developments and Current Focus (as of last summary)

This section reflects the state after a significant documentation consolidation effort.

*   **Authentication & Session Management:** A critical session management bug related to client-side hydration has been resolved by migrating to `@supabase/ssr` and implementing a singleton client pattern. This has stabilized the application significantly.
*   **API Structure:** The frontend API has been refactored into a clear, namespaced structure, accessible via `src/lib/api/index.ts`. This has resolved numerous build errors and improved maintainability.
*   **Documentation Overhaul:** All major documentation files (`README.md`, `PLANNING.md`, `API_ARCHITECTURE.md`, `TASK.md`, `CODEBASE_OVERVIEW.MD`) have been updated to reflect the new architecture.
*   **Key Feature Implementations/Refinements (Archived in `docs/PROJECT_HISTORY.md`):**
    *   Admin Project Files View.
    *   Business Information Request (BIR) feature (multi-step form, signed URL file uploads).
    *   Client portal structural refactor (e.g., `/client` route prefix, dedicated sidebars).
    *   Resolution of significant authentication/session management issues (cross-domain cookies, redirect loops).
    *   Project Timeline enhancements.
*   **Current Active TODOs (Examples from `TASK.MD`):**
    *   Thorough Vercel testing of the BIR signed URL file upload flow.
    *   Clarifying navigation for `/client/my-profile` sub-pages.
    *   Reviewing file handling for non-Web Design project types.
    *   Refining RLS policies for `user_files`.
    *   Implementing `reloadProjectData` in BIR context.
    *   Investigating usage of `/api/projects/[projectId]/user-files/`.

## 10. Getting Started Pointers for New Developers

1.  **Read Key Documentation:**
    *   Start with this `CODEBASE_OVERVIEW.MD`.
    *   Review `README.MD` for project setup and a quick structural overview.
    *   Consult `PLANNING.MD` for deeper architectural insights, feature specifications, and established conventions.
    *   Skim `TASK.MD` to understand current development activities.
    *   Refer to `docs/PROJECT_HISTORY.md` if you need context on why certain past decisions were made or how complex features were implemented.
2.  **Explore the Codebase Structure:**
    *   Familiarize yourself with the main directories: `src/app/`, `src/components/`, `src/lib/`, `src/features/`.
    *   Understand how routing works with the Next.js App Router, especially route groups.
    *   Look at `src/middleware.ts` to grasp authentication and redirection logic.
3.  **Understand Core Flows:**
    *   **Authentication:** Trace the login flow and how `AuthContext` is used.
    *   **Project Display:** See how projects are fetched and displayed for different roles.
    *   **BIR Feature:** Review `src/features/bir/` and the associated API routes (`src/app/api/bir/`) and project page integration (`src/app/(client)/client/projects/web-design/[id]/page.tsx`).
4.  **Set Up Environment:** Follow instructions in `README.MD` to get the project running locally.
5.  **Supabase Console:** Familiarize yourself with the Supabase project dashboard:
    *   Table editor to understand the schema.
    *   Authentication settings (user roles, email templates, URL configurations).
    *   Storage browser.
    *   SQL editor to inspect RLS policies and database functions (or view them in `supabase/migrations/`).
6.  **Ask Questions:** Don't hesitate to ask existing team members for clarification.

This overview should provide a solid foundation for understanding the Drastic Client Portal codebase and enable new developers to contribute effectively. 