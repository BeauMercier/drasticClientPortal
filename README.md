# Drastic Client Portal

A comprehensive client portal built with Next.js, TypeScript, Tailwind CSS, and Supabase for authentication and data storage.

## Features

- **User Authentication**: Secure login with role-based access control (admin, designer, client)
- **Project Management**: Create, view, edit projects with different types and statuses
- **Designer Workload Dashboard**: View and manage designer workloads and project assignments
- **User Management**: Admin interface for creating and managing users
- **Responsive UI**: Modern UI built with Tailwind CSS and shadcn/ui components
- **File Management**: Upload, view, download, and delete general user files and project-specific files via Supabase Storage, with metadata tracked in `user_files` table and access controlled by RLS.
- **Business Information Request (BIR)**: (Web Design Projects Only) An integrated form for clients to submit required business details directly within their web design project workspace, replacing external tools.

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
        /files/   # Files page (/client/files)
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
    ...           # Other shared or feature-specific components

  /lib/          # Core logic, utilities, types, and external service integrations
    /api/         # Centralized API logic (Supabase interactions)
      client-api.ts # Functions for client-side use (respect RLS)
      admin.ts      # Functions for administrative tasks (bypass RLS)
      storage.ts    # File storage operations (interacts with user_files, revision_files)
      server.ts     # Server-side Supabase client initialization
      server-utils.ts # Server-only helpers (authentication, client creation)
      API_ARCHITECTURE.md # Detailed explanation of API structure
    /types/       # Centralized TypeScript types (including ProjectFile, RevisionFile)
    utils.ts      # General utility functions
    ...

  /features/     # Modules for specific application features (e.g., auth)
    /[feature]/   # Contains components, hooks, types specific to a feature

  /shared/       # Shared hooks, types, or UI utilities (e.g., contexts, atoms, molecules)

  /styles/       # Global CSS styles

  middleware.ts  # Next.js edge middleware (auth checks, role-based redirects)

/public/         # Static assets (images, fonts)
/supabase/       # Supabase CLI related files (e.g., migrations, config)
```

## API Endpoints & Logic

- **API Routes (`src/app/api/`)**: These act as the entry points for frontend requests. They handle request validation, authentication checks (often using helpers from `src/lib/api/server-utils.ts`), and then delegate the core business logic.
- **Core API Logic (`src/lib/api/`)**: This directory contains the main implementation for interacting with Supabase (database, auth, storage). It's structured to separate client-safe and server-only code, ensuring security and preventing build errors. **Refer to `src/lib/api/API_ARCHITECTURE.md` for a detailed explanation of this structure.** Key modules include:
  - `client-api.ts`: Functions intended for client-side use (respect RLS).
  - `admin.ts`: Functions for administrative tasks (bypass RLS using service role).
  - `storage.ts`: Constants related to Supabase storage buckets (e.g., FILES_BUCKET).
  - `client.ts` / `server.ts` / `server-utils.ts`: Supabase client initialization and server-side utilities.

Key API routes include:
*   `/api/admin/...`: Routes for administrative tasks (fetching all projects, users, assigning designers).
*   `/api/projects/[projectType]/[projectId]`: Fetching project details (client/designer view).
*   `/api/projects/files/upload`: Handling project-specific file uploads.
*   `/api/user-files/[userFileId]`: Deleting user files.
*   `/api/files/url`: Generating download URLs for files.
*   `/api/bir`: Handling Business Information Request data (GET by projectId, POST for create/upsert, PATCH for updates).

## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profiles with roles
- `projects` - Project information
- `web_design_projects`, `logo_design_projects`, `social_graphics_projects` - Specific project type tables
- `project_assignments` - Tracks which designer is assigned to which project
- `project_revisions`, `