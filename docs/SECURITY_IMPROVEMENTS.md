# Supabase RLS Security Architecture Improvements

## Problem: Infinite Recursion in Row Level Security

The application was experiencing 500 errors during middleware authentication due to an architectural flaw in our Row Level Security (RLS) implementation. The issue was caused by **circular dependencies**:

1. RLS policies checked user roles using functions that queried tables
2. Those tables themselves had RLS policies
3. This created infinite recursion during authorization checks

Example error from logs:
```
GET | 500 | https://brgtyzutexrumzwryisa.supabase.co/rest/v1/profiles?select=role&id=eq.6ec72461-6b45-43da-9f98-66a70e607bc3 | Next.js Middleware
```

## Solution: Domain Separation Architecture

We implemented a complete architectural redesign that separates authentication logic from data access:

### 1. Authentication Schema Isolation

Created a dedicated `auth_helpers` schema that:
- Contains core authentication functions 
- Only queries tables without RLS (`auth.users`)
- Uses `SECURITY DEFINER` to bypass RLS checks
- Provides stable, reliable user role determination

```sql
CREATE SCHEMA IF NOT EXISTS auth_helpers;

CREATE OR REPLACE FUNCTION auth_helpers.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT COALESCE((raw_user_meta_data->>'role')::TEXT, 'unknown')
    FROM auth.users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 2. Public API Compatibility Layer

Created wrapper functions in the public schema that:
- Maintain backward compatibility with existing code
- Delegate to the secure `auth_helpers` functions
- Prevent breaking changes to application code

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN auth_helpers.get_user_role(user_id);
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3. Safe Project Assignment Checking

Implemented a secure approach for role-project relationships:
- Direct database access with RLS bypassing
- No circular dependencies between policies
- Clear separation of authentication and data

```sql
CREATE OR REPLACE FUNCTION auth_helpers.is_designer_assigned_to_project(d_id UUID, p_id UUID, p_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE designer_id = d_id
      AND project_id = p_id
      AND project_type::TEXT = p_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 4. Comprehensive Policy Updates

Rebuilt all RLS policies across the database:
- Replaced direct `public.get_user_role` calls with `auth_helpers.get_user_role`
- Implemented structured, consistent policy patterns
- Applied to all critical tables (profiles, projects, revisions, files, tickets)

## Security Benefits

1. **Eliminates Recursion**: The fundamental architectural change breaks the recursion cycle

2. **Improved Performance**: Fewer recursive calls means faster authorization checks

3. **Consistent Security Model**: Clear separation between authentication logic and data access logic

4. **Maintainable Pattern**: Establishes a pattern for future security implementations

5. **Backward Compatible**: No changes needed to application code, silently fixes issues

## Implementation

The fix was applied in two phases:

1. `permanent_rls_fix.sql`: Core architecture and profiles table fix
2. `permanent_rls_fix_for_all_tables.sql`: Extension to all tables with RLS

This architectural change permanently resolves the infinite recursion issues while maintaining or improving security posture of the application. 