# Drastic Client Portal

Welcome to the Drastic Client Portal, a comprehensive platform for managing client projects, communication, and billing.

This is a full-stack Next.js application designed to streamline the workflow for web design, logo design, and social media projects.

## Key Features

- **Role-Based Dashboards:** Separate, tailored dashboard experiences for Clients, Designers, and Admins.
- **Project Management:** Track project status, stages, and files.
- **Business Information Request (BIR):** A multi-step form for clients to provide essential project information.
- **File Uploads & Storage:** Securely upload and manage project-related files using Supabase Storage.
- **Notifications System:** A robust, real-time notification system to keep users informed of important events.
- **Client Dashboard V2:** A completely redesigned client dashboard (`/client/new-dashboard`) featuring a modern, three-column layout that is both responsive and robust.
  - **Profile V2 (Dev-only):** New profile page at `/client/my-profile-v2` with inline editing, matching the new dashboard’s visual style. Deep-links supported via `?edit=1`.
    - **Architecture**: The layout is built to be highly resilient to different screen sizes. It uses modern CSS (`clamp()`, `max()`, `aspect-ratio`) to establish minimum sizes and prevent content from shrinking or overlapping on smaller viewports, while ensuring it scales gracefully on larger screens. This approach resolved significant challenges related to viewport-unit (`vh`) resizing.
    - **Dynamic Content**: Features dynamically populated sections for profile information, project links, notifications, and recent activity.
    - **Styling**: Heavily customized with Tailwind CSS, including custom borders, colors, text styles, and drop shadows to match the Drastic Digital brand.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), shadcn/ui, Tailwind CSS, React, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication:** JWT, Role-Based Access Control (RBAC)
- **Database:** PostgreSQL, Supabase RLS (Row Level Security)
- **Storage:** Supabase Storage (Buckets: `project-files`, `bir-files`)
- **Real-time:** Supabase Edge Functions, Supabase Replicator
- **UI/UX:** Modern, responsive, and accessible design
- **Dark Mode:** Fully compatible with dark mode, ensuring readability and usability in all lighting conditions.

## Theming defaults

- The app now defaults to dark mode via `ThemeProvider` in `src/app/layout.tsx` (`defaultTheme="dark"`).
- Some dev-only pages (e.g., `/client/new-dashboard`, `/client/my-profile-v2`) explicitly wrap content in a local `div.dark` container to guarantee consistent styling regardless of system/theme state and to bypass aggressive global overrides.

## Error handling (App Router)

- A global App Router error UI exists at `src/app/global-error.tsx`. This prevents the blank screen/overlay message "missing required error components, refreshing..." by providing a resettable fallback UI in development and production.
- If an error occurs on a route, you will see the global error page with a “Try again” button (calls the provided `reset()` action) and a “Go Home” link.

## Authentication & Session Management

The application uses a robust, secure, and modern authentication strategy designed for Server-Side Rendering (SSR) with Next.js.

- **`HttpOnly` Cookies:** User sessions are stored in `HttpOnly` cookies, which are inaccessible to client-side JavaScript. This is a security best practice that prevents XSS (Cross-Site Scripting) attacks from stealing session tokens.
- **SSR-Aware Client (`@supabase/ssr`):** The frontend uses a special Supabase client from the `@supabase/ssr` library. This client is capable of securely sharing the session cookie between server components (which have direct access) and client components (which do not), ensuring a seamless and consistent authentication state across the entire application.
- **Singleton Client Pattern:** The Supabase client is initialized once and reused throughout the application as a singleton. This is implemented in `src/lib/api/client.ts`. For backward compatibility with legacy code, this file also exports a `createClient()` factory and a `default` export, though all new code should use the named export: `import { supabase } from '@/lib/api/client';`.

## API Structure

The application's frontend API is organized into a clear, namespaced structure, accessible via the main entry point at `src/lib/api/index.ts`. This prevents function name collisions and makes the API easier to navigate.

- **Namespaces:** API functions are grouped by domain (e.g., `client`, `storage`).
- **Usage:** To use the API, import the `api` object: `import { api } from '@/lib/api';`. You can then access functions like `api.client.getUserProfile()` or `api.storage.uploadFile()`.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account for backend services

### Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation & Troubleshooting

**Standard Setup:**

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

**Build Troubleshooting:**
During development, the Next.js cache (`.next` folder) or dependencies (`node_modules`) can become corrupted, leading to build failures, blank white screens, or errors like `next: command not found` or `Cannot find module`. If this occurs, perform a clean reinstall:

```bash
# 1. Remove corrupted folders and the lockfile
rm -rf .next node_modules package-lock.json

# 2. Reinstall all dependencies from scratch
npm install

# 3. Restart the development server
npm run dev
```
This process resolves most build-related issues.

### Common dev/runtime warnings and fixes

- Warning: “Next.js (14.x) is outdated” – informational; update is optional.
- Edge Runtime warnings mentioning `@supabase/ssr` or `process.version` are expected when using middleware; these do not block successful builds.
- Error: “missing required error components, refreshing...” – fixed by `src/app/global-error.tsx`. If seen again, ensure the file exists and exports a default client component.
- Error: “Cannot find module './9276.js'” – usually indicates a corrupted `.next` cache. Run the clean reinstall sequence above.

## Profile V2 and Dashboard Integration

- New profile route: `/client/my-profile-v2` (dev-only while iterating)
  - Tabs: Contact Information and Business Information (others removed in V2)
  - Inline Edit: Reuses `EditProfileView` with avatar upload (`uploadProfilePicture`) and profile save (`updateUserProfile`)
  - Query param `?edit=1` opens the edit view immediately (used by dashboard deep-link)
  - “Go Home” link under the top bar logo points to `/client/new-dashboard`
  - Right column shows realtime notifications via `useNotifications` and CTA cards
  - Website Dashboard CTA uses `profile.website_dashboard_url` or fallback to `/client/projects/web-design`
- New dashboard (`/client/new-dashboard`)
  - “Add Info +” → `/client/my-profile-v2?edit=1`
  - “View Profile” → `/client/my-profile-v2`
  - Removed “View Your Profile” from the left menu

## Middleware Behavior

- `src/middleware.ts` contains an early return whitelist for `/client/my-profile-v2` to avoid legacy layout/auth interference during development. Remove this whitelist for production if you require auth enforcement on the V2 page. All other client routes remain protected and role-checked.

## Environment Variables (Vercel)

Set the following in Vercel Project Settings → Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Post-Deploy Verification

- Visit `/client/new-dashboard` and verify profile info, “Add Info +” deep-link (edit mode), and “View Profile” linking to V2
- Visit `/client/my-profile-v2` and verify data population, edit flow saves to Supabase, and avatar updates

## Project Structure

The project follows a standard Next.js App Router structure with key directories organized as follows:
(For details on utility directories like `debug-env/`, `management/`, `lib/supabase/`, and `lib/db/`, please refer to the "Directory Structure" section in `PLANNING.md` or `CODEBASE_OVERVIEW.MD`).
