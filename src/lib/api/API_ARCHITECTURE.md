# API Architecture

This documentation explains the architecture of the API modules in the application, particularly focusing on the separation between client-safe and server-only code.

## Key Modules

The API functionality is organized into several modules:

### Client-Safe Modules

These modules can be imported in both client and server components:

- **`client.ts`**: Provides client-side Supabase client initialization
- **`server.ts`**: Provides service role client functionality that's safe for client import
- **`storage.ts`**: Storage functionality for file operations
- **`client-api.ts`**: Client-side API functions for data operations
- **`admin.ts`**: Admin functionality that's safe for client import

### Server-Only Modules

These modules can ONLY be used in server components or API routes:

- **`server-utils.ts`**: Contains server-only functionality using `next/headers`
- **`server-business-api.ts`**: Server-side business profile operations

## Import Patterns

### For Client Components

```typescript
// Import from client-safe modules
import { createClient } from '@/lib/api/client';
import { createServiceRoleClient } from '@/lib/api/server';
import { FILES_BUCKET } from '@/lib/api/storage';
```

### For Server Components and API Routes

```typescript
// Server-only imports
import { createApiClient, requireAuth } from '@/lib/api/server-utils';

// Client-safe imports also work in server components
import { createServiceRoleClient } from '@/lib/api/server';
```

## API Routes Pattern

For API routes, follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createApiClient, requireAuth } from '@/lib/api/server-utils';
import { createServiceRoleClient } from '@/lib/api/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get data using the API client
    const supabase = createApiClient();
    
    // Rest of the API logic...
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## Common Issues

### "You're importing a component that needs next/headers" Error

This error occurs when server-only code is imported in a client component. To fix:

1. Check if you're importing from `server-utils.ts` in a client component
2. Replace with imports from client-safe modules
3. If server functionality is needed, make an API call to a route that uses the server code

### Admin Operations

Admin operations should typically be performed through API routes using the service role client:

```typescript
// In API route
import { createServiceRoleClient } from '@/lib/api/server';

// Create admin client
const adminClient = createServiceRoleClient();

// Perform admin operation
const { data, error } = await adminClient.from('table').select('*');
```

## Best Practices

1. Always use the most specific import for your needs
2. Prefer client-side functions in client components when possible
3. Create API routes for operations that require server-only functionality
4. Use proper error handling in both client and server code
5. Document any new API modules or functions you create 