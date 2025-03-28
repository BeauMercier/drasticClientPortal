# Session Timeout Implementation

This document explains how the session timeout feature was implemented in the Drastic Client Portal.

## Environment Configuration

Session timeouts are configured via environment variables:

```
# Session Timeout Configuration (in seconds)
# Default session timeout is 8 hours (28800 seconds)
SESSION_TIMEOUT=28800
# Admin session timeout is 2 hours (7200 seconds)
ADMIN_SESSION_TIMEOUT=7200
```

These values are documented in `.env.example` and are validated by the `env.ts` module.

## Implementation Details

### Role-Based Session Timeouts

Different user roles have different session timeout requirements:
- Regular users: 8 hours session lifetime
- Admin users: 2 hours session lifetime (more restrictive for security)

This is implemented through the `auth-timeout.ts` utility which provides:

1. `getClientWithTimeout()`: Creates a Supabase client with a role-specific timeout
2. `applySessionTimeout()`: Sets the appropriate cookie expiry based on user role

### Integration with Authentication Flow

The session timeout is applied after a successful login in the `login()` function in `src/features/auth/api/index.ts`:

```typescript
// Extract role from user metadata
const role = data.user.user_metadata?.role || 'client';

// Apply role-specific session timeout
await applySessionTimeout(
  data.session.access_token,
  data.session.refresh_token,
  role
);
```

### Cookie Settings

The timeout is enforced through cookie settings:

```typescript
cookieOptions: {
  maxAge: sessionTimeout, // Different for admin vs. regular users
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}
```

## Security Benefits

1. Reduced exposure window for stolen session tokens
2. More stringent security for admin accounts with elevated privileges
3. Configurable timeouts that can be adjusted based on security requirements

## Future Improvements

1. Implement session refresh confirmation for sensitive operations
2. Add idle timeout detection on the client side
3. Consider implementing absolute session limits (e.g., require re-login after X days regardless of activity) 