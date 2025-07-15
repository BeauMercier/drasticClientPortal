# Drastic Client Portal

Welcome to the Drastic Client Portal, a comprehensive platform for managing client projects, communication, and billing.

This is a full-stack Next.js application designed to streamline the workflow for web design, logo design, and social media projects.

## Key Features

- **Role-Based Dashboards:** Separate, tailored dashboard experiences for Clients, Designers, and Admins.
- **Project Management:** Track project status, stages, and files.
- **Business Information Request (BIR):** A multi-step form for clients to provide essential project information.
- **File Uploads & Storage:** Securely upload and manage project-related files using Supabase Storage.
- **Notifications System:** A robust, real-time notification system to keep users informed of important events, such as project stage updates and required actions. The system is designed to be highly visible and readable in both light and dark modes.

## Tech Stack

- **Frontend:** Next.js 14, shadcn/ui, Tailwind CSS, React, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication:** JWT, Role-Based Access Control (RBAC)
- **Database:** PostgreSQL, Supabase RLS (Row Level Security)
- **Storage:** Supabase Storage (Buckets: `project-files`, `bir-files`)
- **Real-time:** Supabase Edge Functions, Supabase Replicator
- **UI/UX:** Modern, responsive, and accessible design
- **Dark Mode:** Fully compatible with dark mode, ensuring readability and usability in all lighting conditions.

## Authentication & Session Management

The application uses a robust, secure, and modern authentication strategy designed for Server-Side Rendering (SSR) with Next.js.

- **`HttpOnly` Cookies:** User sessions are stored in `HttpOnly` cookies, which are inaccessible to client-side JavaScript. This is a security best practice that prevents XSS (Cross-Site Scripting) attacks from stealing session tokens.
- **SSR-Aware Client (`@supabase/ssr`):** The frontend uses a special Supabase client from the `@supabase/ssr` library. This client is capable of securely sharing the session cookie between server components (which have direct access) and client components (which do not), ensuring a seamless and consistent authentication state across the entire application.
- **Singleton Client Pattern:** The Supabase client is initialized once and reused throughout the application as a singleton. This is implemented in `src/lib/api/client.ts`. For backward compatibility with legacy code, this file also exports a `createClient()` factory and a `default` export, though all new code should use the named export: `import { supabase } from '@/lib/api/client';`.

## API Structure

The application's frontend API is organized into a clear, namespaced structure, accessible via the main entry point at `src/lib/api/index.ts`. This prevents function name collisions and makes the API easier to navigate.

- **Namespaces:** API functions are grouped by domain (e.g., `client`, `storage`).
- **Usage:** To use the API, import the `api` object: `import { api } from '@/lib/api';`. You can then access functions like `api.client.getUserProfile()` or `api.storage.uploadFile()`.

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
   - **Note on Stability:** A critical client-side race condition that could cause "403 Forbidden" errors upon saving a new BIR draft has been resolved. The form now waits for all necessary user and project data to be loaded before allowing save actions, ensuring stability.
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
(For details on utility directories like `debug-env/`, `management/`, `lib/supabase/`, and `lib/db/`, please refer to the "Directory Structure" section in `