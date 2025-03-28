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

```
/src
  /app - Next.js app router pages
    /admin - Admin dashboard pages
    /api - API routes
    /auth - Authentication pages
    /dashboard - Client dashboard pages
  /components - Reusable UI components
  /lib - Utility functions and shared libraries
  /styles - Global styles
```

## API Endpoints

### Authentication

- `/api/auth/callback` - OAuth callback endpoint
- `/api/auth/signout` - Sign out endpoint

### Admin 

- `/api/admin/users` - User management
- `/api/admin/projects/[type]/[id]` - Project details
- `/api/admin/projects/[type]/[id]/assignment` - Project designer assignment

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