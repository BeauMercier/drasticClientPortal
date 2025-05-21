# Drastic Client Portal

A comprehensive client portal built with Next.js, TypeScript, Tailwind CSS, and Supabase for authentication and data storage.

## Features

- **User Authentication**: Secure login with role-based access control (admin, designer, client)
- **Project Management**: Create, view, edit projects with different types and statuses
- **Designer Workload Dashboard**: View and manage designer workloads and project assignments
- **User Management**: Admin interface for creating and managing users
- **Responsive UI**: Modern UI built with Tailwind CSS and shadcn/ui components
- **Admin Project Files View**: Admin interface to view files associated with a project, initially focusing on BIR-related files.
- **File Management**: 
    - General user files and project-specific files (non-BIR) via Supabase Storage (`project-files` bucket), with metadata in `user_files` table and RLS.
- **Business Information Request (BIR)**: (Web Design Projects Only) An integrated, multi-step form for clients to submit required business details directly within their web design project (via dedicated tabs).
   - Includes file uploads for BIR-specific documents (e.g., logos, style guides) stored in a separate private Supabase Storage bucket (`bir-files`) with metadata in `bir_file` table, all controlled by RLS using a signed URL flow.
- **Enhanced Project Timeline**:
    - **Clear status colours:** current (blue), completed (green), pending (gray).
    - **Accurate progression:** driven by `current_stage`.
    - **Delivery special-case:** final stage turns green once `delivery_date` is set, even while it's current.
    - **Title standardisation:** all project types now use `title` (no more `name` bugs in admin).
    - **Optional DB trigger:** see `fill_missing_stage_dates` (SQL) to auto-fill earlier stage dates and guarantee integrity.

- **Client Dashboard Enhancements**:
    - **Active Projects Section**: Displays ongoing client projects. If one project is active, a detailed timeline is shown. If multiple are active, they are displayed as interactive cards.
    - **Quick Links Section**: Provides easy access to common areas like "Website Dashboard", "Lead Dashboard", and "Support". Links and their presentation are theme-aware (light/dark mode).
    - **Dynamic Header**: Welcomes the client by their first name.
    - **Improved Layout**: "Quick Links" are positioned below "Active Projects" for better information flow.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account for backend services

### Environment Setup

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important Configuration Notes:**
*   **Cookie Domain:** The application is configured to set authentication cookies on the `.drasticdigital.com` parent domain to ensure seamless authentication across subdomains (e.g., Vercel preview URLs and the production portal). This is handled in `src/middleware.ts`.
*   **Role-Based Redirects:** The `src/middleware.ts` and the root page (`src/app/page.tsx`) handle redirecting authenticated users to their appropriate role-specific dashboards (e.g., `/client`, `/admin`). A centralized configuration for these paths is in `src/lib/config/auth-config.ts`, which defines `roleBasePaths`.
*   **Middleware Optimizations:** `src/middleware.ts` includes logic for early returns on static asset paths and public routes (like `/login`) to prevent unnecessary Supabase client initialization, improving performance and stability.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

The project follows a standard Next.js App Router structure with key directories organized as follows:
(For details on utility directories like `debug-env/`, `management/`, `lib/supabase/`, and `lib/db/`, please refer to the "Directory Structure" section in `PLANNING.md`.)

```
/src
  /app/          # Next.js App Router: Defines routes, pages, layouts, API endpoints
    /(admin)/     # Route group for admin pages
      /admin/     # Admin-specific pages (e.g., /admin/users)
      layout.tsx  # Admin layout (uses AdminSidebar)
    /(client)/    # Route group for client pages
      /client/    # Defines /client base path
        page.tsx  # Client Dashboard (/client)
        /my-profile/ # Profile page (/client/my-profile)
        /projects/ # Project pages (/client/projects) - Contains sub-routes like /web-design, /logo-design
        /billing/ # Billing page (/client/billing)
      layout.tsx  # Client layout (uses ClientSidebar)
    /(designer)/  # Route group for designer pages
      /designer/  # Designer-specific pages (e.g., /designer/dashboard)
      layout.tsx  # Designer layout (uses RoleSidebar via DashboardLayout)
    /api/         # Backend API route handlers
      /projects/  # API routes specifically for project operations
        /[projectId]/user-files/ # Lists files for a project from user_files
        /files/   # API routes for project file handling
          /upload/ # Handles project file uploads (inserts into user_files)
      /bir/       # API routes for Business Information Request
        route.ts  # Handles GET/POST/PATCH for BIR text data
        /upload/route.ts # (DEPRECATED) Was for BIR file uploads, now uses signed URL flow.
        /create-upload-url/route.ts # POST to generate a signed URL for direct BIR file upload.
        /record-file/route.ts # POST to record BIR file metadata after direct upload.
      /files/     # General file operations
        /url/     # Generates signed URLs for storage objects
      /user-files/ # Operations on user_files table records
        /[userFileId]/ # Handles deletion of user_files record + storage object
    /[route]/     # Individual top-level page routes (e.g., login)
    layout.tsx    # Root application layout
    page.tsx      # Root application page (homepage)

  /components/   # Reusable UI components
    /ui/          # shadcn/ui base components
    /layout/      # Layout-specific components (Header, DashboardLayout)
    /admin/       # Admin-specific components (AdminSidebar)
    /client/      # Client-specific components (ClientSidebar)
    RoleSidebar.tsx # Sidebar showing different links based on role (used by Designer)
    BirFileUploader.tsx # Component for BIR file uploads
    ...           # Other shared or feature-specific components

  /lib/          # Core logic, utilities, types, and external service integrations
    /api/         # Centralized API logic (Supabase interactions)
      client-api.ts # Functions for client-side use (respect RLS)
      admin.ts      # Functions for administrative tasks (bypass RLS)
      storage.ts    # Provides a StorageService class for interacting with Supabase Storage (upload, download, list files, etc.) and defines storage-related constants like bucket names.
      server.ts     # Server-side Supabase client initialization
      server-utils.ts # Server-only helpers (authentication, client creation)
      API_ARCHITECTURE.MD # Detailed explanation of API structure
      bir.ts        # Helper functions for BIR data operations
    /types/       # Centralized TypeScript types (e.g., Project, User, BIR related types)
    /utils/       # General utility functions
    /config/      # Project-wide configurations (e.g., auth-config.ts)
    ...

  /features/     # Modules for specific application features (e.g., auth)
    /[feature]/   # Contains components, hooks, types specific to a feature
    /bir/         # Hooks, Form, Summary, Gate components for BIR feature

  /shared/       # Shared hooks, types, or UI utilities (e.g., contexts, atoms, molecules)

  /styles/       # Global CSS styles

  middleware.ts  # Next.js edge middleware (auth checks, role-based redirects, cookie domain management)
  src/lib/config/auth-config.ts # Centralized configuration for role base paths

/public/         # Static assets (images, fonts)
/supabase/       # Supabase CLI related files (e.g., migrations, config)
  /migrations/  # Database migration files (including for bir_file table)
```

## API Endpoints & Logic

- **API Routes (`src/app/api/`)**: These act as the entry points for frontend requests. They handle request validation, authentication checks (often using helpers from `src/lib/api/server-utils.ts`), and then delegate the core business logic.
- **Core API Logic (`src/lib/api/`)**: This directory contains the main implementation for interacting with Supabase (database, auth, storage). It's structured to separate client-safe and server-only code, ensuring security and preventing build errors. **Refer to `src/lib/api/API_ARCHITECTURE.MD` for a detailed explanation of this structure.** Key modules include:
  - `client-api.ts`: Functions intended for client-side use (respect RLS).
  - `admin.ts`: Functions for administrative tasks (bypass RLS using service role).
  - `storage.ts`: Provides a `StorageService` class for interacting with Supabase Storage and defines storage-related constants.
  - `client.ts` / `server.ts` / `server-utils.ts`: Supabase client initialization and server-side utilities.

Key API routes include:
*   `/api/admin/...`: Routes for administrative tasks (fetching all projects, users, assigning designers).
*   `/api/admin/project-files/[projectType]/[projectId]`: Fetches BIR files for a specific project for admin view.
*   `/api/projects/[projectType]/[projectId]`: Fetching project details (client/designer view).
*   `/api/projects/files/upload`: Handling project-specific file uploads (non-BIR).
*   `/api/user-files/[userFileId]`: Deleting user files.
*   `/api/files/url`: Generating download URLs for files.
*   `/api/bir`: Handling Business Information Request text data (GET by projectId, POST for create/upsert, PATCH for updates).
*   `/api/bir/upload`: (DEPRECATED) Previously handled BIR file uploads. Superseded by:
*   `/api/bir/create-upload-url`: POST to generate a signed URL for direct client upload of a BIR file.
*   `/api/bir/record-file`: POST to record metadata of a BIR file after direct upload.

## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profiles with roles
- `projects` - Project information
- `web_design_projects`, `logo_design_projects`, `social_graphics_projects` - Specific project type tables
- `designer_projects` - Tracks which designer is assigned to which project
- `project_revisions`, `revision_files` - For project revision deliverables.
- `user_files` - Metadata for general user files and non-BIR project files.
- `business_information_requests` - Stores the main data for BIR.
- `bir_file` - Stores metadata for files uploaded as part of a BIR.

## Recent Stability Improvements

Recent updates have resolved several critical issues related to authentication and navigation:
*   **Page loading hangs and "Auth session missing!" errors** caused by cross-domain cookie problems on Vercel preview deployments have been fixed by pinning cookies to the parent domain (`.drasticdigital.com`) and optimizing Supabase client initialization in the middleware.
*   **Incorrect redirects from the root path (`/`)** for authenticated users have been corrected. Users are now directed to their role-specific dashboards as defined in `src/lib/config/auth-config.ts`.
*   **A redirect loop to `/login`** for unauthenticated users has been fixed by ensuring `/login` is not treated as a protected route by the middleware.

These changes contribute to a more stable and reliable user experience.