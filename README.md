# Drastic Client Portal

A comprehensive client portal built with Next.js, TypeScript, Tailwind CSS, and Supabase for authentication and data storage.

## Features

- **User Authentication**: Secure login with role-based access control (admin, designer, client)
- **Project Management**: Create, view, edit projects with different types and statuses
- **Designer Workload Dashboard**: View and manage designer workloads and project assignments
- **User Management**: Admin interface for creating and managing users
- **Responsive UI**: Modern UI built with Tailwind CSS and shadcn/ui components

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
    /(dashboard)/ # Route group for shared dashboard layout (admin, designer)
    /api/         # Backend API route handlers (uses logic from /lib/api)
    /[route]/     # Individual page routes (e.g., login, projects, settings)
    layout.tsx    # Root application layout
    page.tsx      # Root application page

  /components/   # Reusable UI components (including /ui primitives from shadcn/ui)
    /ui/          # shadcn/ui base components
    /layout/      # Layout-specific components (Header, Footer, etc.)
    /admin/       # Components specific to admin sections
    ...           # Other shared or feature-specific components

  /lib/          # Core logic, utilities, types, and external service integrations
    /api/         # Centralized API logic (Supabase interactions)
      # Contains modules for client, server, admin, storage operations
      # See src/lib/api/API_ARCHITECTURE.md for detailed structure & usage
    /db/          # Database related files (e.g., migrations)
    /supabase/    # Supabase client initialization helpers
    /types/       # Centralized TypeScript types (domain types, db types)
    utils.ts      # General utility functions
    logger.ts     # Logging setup
    env.ts        # Environment variable handling

  /features/     # Modules for specific application features (e.g., auth, projects)
    /[feature]/   # Contains components, hooks, types specific to a feature

  /shared/       # Shared hooks, types, or utilities (review if needed vs /lib)

  /styles/       # Global CSS styles

  middleware.ts  # Next.js edge middleware (e.g., for auth checks)

/public/         # Static assets (images, fonts)
/supabase/       # Supabase CLI related files (e.g., migrations, config)
```

## API Endpoints & Logic

- **API Routes (`src/app/api/`)**: These act as the entry points for frontend requests. They handle request validation, authentication checks (often using helpers from `src/lib/api/server-utils.ts`), and then delegate the core business logic.
- **Core API Logic (`src/lib/api/`)**: This directory contains the main implementation for interacting with Supabase (database, auth, storage). It's structured to separate client-safe and server-only code, ensuring security and preventing build errors. **Refer to `src/lib/api/API_ARCHITECTURE.md` for a detailed explanation of this structure.** Key modules include:
  - `client-api.ts`: Functions intended for client-side use (respect RLS).
  - `admin.ts`: Functions for administrative tasks (bypass RLS using service role).
  - `storage.ts`: File storage operations.
  - `client.ts` / `server.ts` / `server-utils.ts`: Supabase client initialization and server-side utilities.

## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profiles with roles
- `projects` - Project information
- `project_assignments` - Tracks which designer is assigned to which project

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.