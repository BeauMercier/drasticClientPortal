# Supabase Security Recommendations

This document outlines recommended security enhancements for the Supabase implementation in the Drastic Client Portal application.

## Row-Level Security (RLS) Audit

Based on the codebase review, we identified the following RLS implementation status:

### Current Status

- Some tables have RLS policies in place (business_profiles, designer_tasks, project_assignments)
- RLS setup endpoint exists at `/api/admin/security/rls-setup/route.ts` but appears to be limited to designer-related tables
- No comprehensive RLS audit has been performed across all tables

### Recommendations

1. **Complete RLS Audit and Implementation**

   Create RLS policies for all tables in the database:

   ```sql
   -- For each table without RLS:
   ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

   -- Standard policies to implement:
   -- 1. Users can view their own data
   CREATE POLICY "Users can view their own data" 
     ON [table_name] FOR SELECT 
     USING (auth.uid() = user_id);
     
   -- 2. Users can update their own data
   CREATE POLICY "Users can update their own data" 
     ON [table_name] FOR UPDATE 
     USING (auth.uid() = user_id);

   -- 3. Admins can view all data
   CREATE POLICY "Admins can view all data" 
     ON [table_name] FOR SELECT 
     USING (get_user_role(auth.uid()) = 'admin');
     
   -- 4. Admins can update all data
   CREATE POLICY "Admins can update all data" 
     ON [table_name] FOR UPDATE 
     USING (get_user_role(auth.uid()) = 'admin');
     
   -- 5. Designer-specific policies (for relevant tables)
   CREATE POLICY "Designers can view assigned data" 
     ON [table_name] FOR SELECT 
     USING (
       get_user_role(auth.uid()) = 'designer' AND
       [table_name].project_id IN (
         SELECT project_id FROM project_assignments WHERE designer_id = auth.uid()
       )
     );
   ```

2. **Prioritize Critical Tables**

   Implement RLS for these high-priority tables first:
   - web_design_projects
   - logo_design_projects
   - social_graphics_projects
   - profiles
   - project_revisions
   - revision_files
   - revision_comments
   - support_tickets

3. **Ensure Cross-Table Security**

   Many operations (like fetching project details) span multiple tables. Ensure RLS is consistent across related tables.

4. **Automated Testing for RLS Policies**

   Create test scripts to verify that RLS policies are working as expected:
   - A client can only access their own projects
   - A designer can only access projects assigned to them
   - An admin can access all projects

## Authentication Security

### Current Status

- Basic email/password authentication is implemented
- No session timeout configuration found
- No MFA implementation for admin accounts
- No rate limiting for authentication endpoints

### Recommendations

1. **Session Timeout Configuration**

   Configure appropriate session timeouts for different user roles:

   ```typescript
   // In the Supabase client configuration
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
     {
       auth: {
         autoRefreshToken: true,
         persistSession: true,
         detectSessionInUrl: true,
         // Set session timeout - 8 hours for regular users, 2 hours for admins
         // You'll need to implement custom logic to enforce different timeouts by role
         // since Supabase doesn't support this natively
       }
     }
   );
   ```

   ✅ **Implemented:** The application now applies different session timeouts based on user roles:
   - Regular users: 8 hours (28800 seconds) session lifetime
   - Admin users: 2 hours (7200 seconds) session lifetime

   Implementation details:
   - Environment variables `SESSION_TIMEOUT` and `ADMIN_SESSION_TIMEOUT` control the timeout values
   - The auth-timeout.ts utility provides `applySessionTimeout()` to apply appropriate timeouts
   - Timeout is applied after successful login based on the user's role
   - Cookie settings enforce the timeouts on the client side
   - Configuration is managed through `.env` file with appropriate defaults

2. **Implement Rate Limiting for Auth Endpoints**

   Add rate limiting to auth endpoints to prevent brute force attacks:

   ```typescript
   // Implement in API routes, particularly for login endpoints
   // Example middleware approach:
   
   import rateLimit from 'express-rate-limit';
   
   // Create rate limiter
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10, // limit each IP to 10 requests per windowMs
     message: 'Too many login attempts, please try again later'
   });
   
   // Apply to auth routes
   app.use('/api/auth/*', authLimiter);
   ```

3. **Multi-Factor Authentication (MFA) for Admin Accounts**

   Implement MFA for admin accounts using Supabase Auth:

   ```typescript
   // Add MFA enrollment functionality for admin users
   // This would involve:
   // 1. Enabling MFA in Supabase dashboard
   // 2. Adding MFA enrollment UI in admin settings
   // 3. Implementing MFA verification during login
   
   // Example MFA enrollment
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp',
     issuer: 'Drastic Client Portal',
   });
   
   // Verify MFA during login flow
   const { data, error } = await supabase.auth.mfa.challenge({
     factorId: 'totp_factor_id',
   });
   
   const { data, error } = await supabase.auth.mfa.verify({
     factorId: 'totp_factor_id',
     code: '123456',
     challengeId: 'challenge_id',
   });
   ```

4. **Implement CSRF Protection**

   Ensure proper CSRF protection is in place for all authenticated requests:

   ```typescript
   // Example implementation using Next.js middleware to validate CSRF tokens
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function middleware(request: NextRequest) {
     // For mutation routes, validate CSRF token
     if (request.method !== 'GET' && request.method !== 'HEAD') {
       const csrfToken = request.headers.get('X-CSRF-Token');
       const sessionToken = request.cookies.get('sb-session');
       
       // Validate that CSRF token matches expected value derived from session
       // This is a simplified example - implement proper validation
       if (!csrfToken || !validateCsrfToken(csrfToken, sessionToken)) {
         return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
       }
     }
     
     return NextResponse.next();
   }
   ```

## Secure Coding Practices

1. **Use Parameterized Queries**

   Ensure all database queries use parameterized queries to prevent SQL injection:

   ```typescript
   // Bad
   const { data, error } = await supabase.rpc('exec_sql', { 
     sql: `SELECT * FROM users WHERE id = '${userId}'` 
   });
   
   // Good
   const { data, error } = await supabase
     .from('users')
     .select('*')
     .eq('id', userId);
   ```

2. **Validate Input Data**

   Validate all user input before processing:

   ```typescript
   // Implement request validation for all API endpoints
   import { z } from 'zod';
   
   const userUpdateSchema = z.object({
     fullName: z.string().min(1).max(100),
     email: z.string().email(),
     role: z.enum(['client', 'designer', 'admin']),
   });
   
   export async function POST(req: Request) {
     try {
       const body = await req.json();
       const validatedData = userUpdateSchema.parse(body);
       // Process validated data
     } catch (error) {
       // Handle validation error
       return Response.json({ error: 'Invalid input data' }, { status: 400 });
     }
   }
   ```

3. **Implement Secure File Uploads**

   Enhance security for file uploads:

   ```typescript
   // Validate file types
   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
   if (!allowedTypes.includes(file.type)) {
     return { error: 'File type not allowed' };
   }
   
   // Limit file size
   const MAX_SIZE = 5 * 1024 * 1024; // 5MB
   if (file.size > MAX_SIZE) {
     return { error: 'File size exceeds limit' };
   }
   
   // Scan for malware (integrate with a service like ClamAV)
   const isSafe = await scanFile(file);
   if (!isSafe) {
     return { error: 'File failed security scan' };
   }
   ```

## Implementation Checklist

- [x] Audit all database tables for RLS policies
- [x] Implement missing RLS policies
- [x] Configure session timeout
- [ ] Add rate limiting to auth endpoints
- [ ] Implement MFA for admin accounts
- [ ] Add CSRF protection
- [ ] Ensure secure coding practices throughout
- [ ] Test security measures
- [ ] Document security implementations 