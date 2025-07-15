# API Architecture

This documentation explains the architecture of the API modules in the application, particularly focusing on the separation between client-safe and server-only code.

## Key Modules

The API functionality is organized into several modules:

### Client-Safe Modules

These modules can be imported in both client and server components:

- **`client.ts`**: Provides client-side Supabase client initialization using `createBrowserClient` from `@supabase/ssr`. Exports `createClient()` for general use and `createAdminClient()` which is a browser client with a shorter admin-specific cookie timeout.
- **`storage.ts`**: Provides a `StorageService` class with methods for file operations (upload, download, list, delete, etc.) interacting with Supabase Storage.
- **`client-api.ts`**: Client-side API functions for data operations.

### Server-Only Modules

These modules can ONLY be used in server components or API routes:

- **`server.ts`**: Provides server-side Supabase client initialization using the Service Role Key. Exports `createServiceRoleClient()` for general service role access and `createAdminClient()` which is also a service role client, potentially with additional configurations like custom headers.
- **`server-utils.ts`**: Contains server-only functionality using `next/headers` (e.g., `createApiClient` for API routes, `requireAuth`).
- **`admin.ts`**: Admin data access helper functions (e.g., `listUsers`, `createUser`). These functions internally use the service role client and are intended for use in server-side API routes.
- **`server-business-api.ts`**: Server-side helper functions for business profile operations (e.g., `getBusinessProfileById`). These functions use either the service role client or the API client (`createApiClient`) and are intended for server-side/API route use.
- **`bir.ts`**: Server-side data access helpers for Business Information Request (BIR) text data (e.g., `fetchBirByProject`, `upsertBir`).

## Import Patterns

### For Client Components

```typescript
// Import from client-safe modules
import { createClient } from '@/lib/api/client';
// import { FILES_BUCKET } from '@/lib/api/storage'; // Example if storage constants are exported
```

### For Server Components and API Routes

```typescript
// Server-only imports
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { createServiceRoleClient, createAdminClient as createServerAdminClient } from '@/lib/api/server'; // Alias admin client for clarity

// Specific data access helpers (can be used server-side)
import { listUsers } from '@/lib/api/admin'; // Example for admin helpers
import { fetchBirByProject } from '@/lib/api/bir'; // Example for BIR feature
```

## Data Access Helper Pattern

For interacting with specific database tables or logical data domains (like Projects, Users, Files, Business Information Requests), we create dedicated helper files within `src/lib/api/` (e.g., `src/lib/api/admin.ts`, `src/lib/api/bir.ts`, `src/lib/api/server-business-api.ts`).

- **Purpose:** Encapsulate Supabase client calls (`createApiClient` for RLS-respecting user context, or `createServiceRoleClient` for admin/privileged operations) and specific queries/mutations related to that data domain.
- **Usage:** These helper functions are typically called from API routes (`src/app/api/...`) or server components.
- **Benefits:** Centralizes data logic, promotes reusability, separates data access concerns from API route handling.

```typescript
// Example: src/lib/api/bir.ts
import { createApiClient } from '@/lib/api/server-utils'; // Or createServiceRoleClient if needed
import { birInsertSchema } from '@/lib/validation/bir';

export async function fetchBirByProject(projectId: string) {
  const supabase = createApiClient(); // RLS is enforced if using createApiClient
  // ... Supabase query ...
}

export async function upsertBir(payload: unknown) {
  const parsed = birInsertSchema.parse(payload);
  const supabase = createApiClient(); // RLS is enforced
  // ... Supabase upsert ...
}
```

## API Routes Pattern

API routes in `src/app/api/...` handle incoming HTTP requests, perform authentication/authorization (often using `requireAuth` from `server-utils.ts`), validate input (often using Zod schemas), call the relevant data access helper functions, and return JSON responses.

**Example Routes:** `/api/admin/users`, `/api/projects/files/upload`, `/api/bir`

```typescript
// Example: src/app/api/bir/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/server-utils'; // Corrected path
import { fetchBirByProject, upsertBir } from '@/lib/api/bir'; // Use helpers
import { birInsertSchema } from '@/lib/validation/bir'; // Use validation

export async function GET(req: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  // ... validation ...
  try {
    const bir = await fetchBirByProject(projectId!);
    return NextResponse.json(bir);
  } catch (e: any) {
    // ... error handling ...
  }
}

export async function POST(req: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 });
  }
  const body = await req.json();
  try {
    // Use Zod schema directly or within the helper
    // const validatedData = birInsertSchema.parse(body);
    const bir = await upsertBir(body); // Helper handles validation
    return NextResponse.json(bir, { status: 201 });
  } catch (e: any) {
    // ... error handling ...
  }
}
```

### Signed URL Upload Flow for BIR Files

A specific pattern is used for Business Information Request (BIR) file uploads to handle potentially large files and offload work from the server:

1.  **Client Requests Signed URL:** The client makes a `POST` request to `/api/bir/create-upload-url`, providing metadata like `birId`, `filename`, and `mimeType`.
2.  **Server Generates Signed URL:** This API route uses the Supabase service role client to generate a short-lived, pre-signed URL that grants temporary write access to a specific path in the private `bir-files` Supabase Storage bucket.
3.  **Client Uploads Directly to Storage:** The client receives the signed URL and uploads the file directly to Supabase Storage using an HTTP PUT request to that URL.
4.  **Client Records File Metadata:** After a successful upload to storage, the client makes a `POST` request to `/api/bir/record-file`, sending the `birId`, `objectKey` (from the signed URL response or derived), `size`, `mimeType`, `originalName`, and `fileType`.
5.  **Server Records Metadata:** This API route creates an entry in the `bir_file` database table, linking the uploaded file to the BIR.

This pattern avoids proxying the file through the Next.js server, improving performance and scalability for file uploads.

## Common Issues

### "You're importing a component that needs next/headers" Error

This error occurs when server-only code (especially functions from `server-utils.ts` that use `cookies()` or `headers()` from `next/headers`) is imported and executed in a client component. To fix:

1. Ensure you're not importing from `server-utils.ts` or other server-only modules in a client component.
2. Replace with imports from client-safe modules if equivalent functionality exists.
3. If server functionality is needed, make an API call from the client component to an API route that uses the server code.

### Admin Operations

Admin operations should typically be performed through API routes using the service role client:

```typescript
// In API route
import { createServiceRoleClient } from '@/lib/api/server';

// Create admin client
const adminSupabase = createServiceRoleClient(); // Renamed for clarity

// Perform admin operation
const { data, error } = await adminSupabase.from('table').select('*');
```

### Architectural Case Study: Diagnosing a "403 Forbidden" Error

A real-world example that illustrates this architecture is the resolution of a "403 Forbidden" error on the Business Information Request (BIR) form.

- **Symptom**: Saving a new BIR draft resulted in a 403 error from the `/api/bir` endpoint.
- **Investigation Path**:
    1.  **API Route (`/api/bir`)**: The route handler was correctly catching a generic database error and returning a 403 status, indicating a permissions issue.
    2.  **Data Access Helper (`/lib/api/bir.ts`)**: The `upsertBir` function was correctly sending data to the database.
    3.  **Database RLS Policies**: The Row Level Security policy on the `business_information_requests` table was identified as the source of the rejection. It required a valid `client_id` matching the authenticated user.
    4.  **Client-Side Component (`/features/bir/MultiStepBirForm.tsx`)**: The root cause was traced back to a race condition. The component could send the save request *before* the `useAuth()` hook provided the `user.id`, leading to an invalid `client_id`.
- **Conclusion**: This demonstrates the full-stack nature of an issue. The error manifested in the database (RLS policy) but was caused by a state and timing issue in a client-side component. The fix involved making the client component aware of the authentication loading state and disabling UI actions until all necessary data was present, ensuring the API is always called with a valid payload.

## Best Practices

1. Always use the most specific import for your needs (client vs. server clients).
2. Prefer client-side API helper functions (`client-api.ts`) in client components when possible for RLS-enforced data fetching.
3. Create API routes for operations that require server-only functionality, elevated privileges (service role), or to encapsulate complex business logic.
4. Use proper error handling in both client and server code.
5. Document any new API modules or significant functions you create. 