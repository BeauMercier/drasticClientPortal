# Notifications & Client Onboarding System - Implementation Plan

This document outlines the technical implementation plan for the new notifications and client onboarding system.

────────────────────────────────────────
## 1. DATABASE LAYER & INITIAL TRIGGERS (CONSOLIDATED)
────────────────────────────────────────

The entire initial database setup for the notifications system, including the `notifications` table, RLS policies, helper functions, and the initial trigger for new client welcome/profile completion notifications, is provided in a single SQL migration script.

**Action:**
1.  Save the comprehensive SQL script (provided by the user on [Current Date]) into a new migration file named `supabase/migrations/YYYYMMDDHHMMSS_create_notifications_system.sql` (replace YYYYMMDDHHMMSS with the actual timestamp).
2.  Apply this migration to your Supabase project (either via `supabase db push` or by running directly in the Supabase SQL Editor).

**The consolidated SQL script covers the following (originally planned as separate steps):**
*   Creation of the `public.notifications` table with appropriate columns and comments.
*   An index on `(user_id, status, created_at desc)` for efficient querying.
*   Row-Level Security policies:
    *   Allowing users to read their own notifications.
    *   Allowing users to update their own notifications (for status changes).
*   Convenience Postgres functions:
    *   `public.mark_notification_read(_nid uuid)`
    *   `public.mark_all_notifications_read()`
*   Automated "Welcome + Complete Profile" notifications:
    *   A PL/pgSQL function `public.notify_new_client()` that inserts two notifications for new users with the 'client' role.
    *   A trigger `tg_notify_new_client` on the `public.profiles` table that executes this function after insert.

**(The content of the consolidated SQL script is as follows for reference within this plan):**
```sql
/**********************************************************************
*  NOTIFICATIONS SYSTEM – ONE-SHOT SQL MIGRATION
*  ------------------------------------------------------------
*  1.  Table:           public.notifications
*  2.  Indexes
*  3.  Row-Level Security policies
*  4.  Utility functions: mark_notification_read / mark_all_notifications_read
*  5.  Trigger & function: automated "Welcome / Complete profile" messages
*  ------------------------------------------------------------
*  Assumptions:
*    • A table public.profiles(id uuid PK, role text) already exists.
*    • You want to notify ONLY users whose profiles.role = 'client'
*    • pgcrypto extension (for gen_random_uuid) is available.
**********************************************************************/

-------------------------
-- 0. SAFETY / EXTENSIONS
-------------------------
-- (Skip if already created in your project)
create extension if not exists pgcrypto;

-------------------------
-- 1. NOTIFICATIONS TABLE
-------------------------
create table if not exists public.notifications (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null
                   references public.profiles(id) on delete cascade,
  title         text        not null,
  message       text        not null,
  link          text,                     -- optional deep-link
  type          text        not null default 'info',      -- info | warning | action_required | success
  status        text        not null default 'unread',    -- unread | read | dismissed
  trigger_event text,                     -- e.g. new_client_signup
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);

-------------------------
-- 2. INDEXES
-------------------------
-- Fast look-up of newest unread
create index if not exists notifications_user_status_idx
  on public.notifications(user_id, status, created_at desc);

-------------------------
-- 3. ROW-LEVEL SECURITY
-------------------------
alter table public.notifications enable row level security;

-- Clients read THEIR OWN rows
create policy "Notifications: client can read own"
  on public.notifications
  for select
  using (auth.uid() = user_id);

-- Clients update only their own rows (mark read/dismiss)
create policy "Notifications: client can update own"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow inserts from backend service-role or DB triggers
-- (no policy required; service-role bypasses RLS)

-------------------------
-- 4. UTILITY RPC FUNCTIONS
-------------------------
-- Mark single notification read
create or replace function public.mark_notification_read(_nid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set status = 'read',
         read_at = now()
   where id = _nid
     and user_id = auth.uid();
$$;

-- Mark ALL unread notifications read
create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set status = 'read',
         read_at = now()
   where user_id = auth.uid()
     and status  = 'unread';
$$;

grant execute on function public.mark_notification_read(uuid)        to authenticated, service_role;
grant execute on function public.mark_all_notifications_read()       to authenticated, service_role;

-------------------------
-- 5. AUTOMATED "WELCOME + COMPLETE PROFILE" NOTIFICATIONS
-------------------------
-- Function that inserts the two starter notifications
create or replace function public.notify_new_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only run if role is 'client'
  if new.role = 'client' then
    -- 5-1  Welcome
    insert into public.notifications
      (user_id, title, message, link, type, trigger_event)
    values
      (new.id,
       'Welcome to the Portal!',
       'Thanks for joining. Let''s get your project off on the right foot.',
       null,
       'info',
       'new_client_signup');

    -- 5-2  Action required: complete profile
    insert into public.notifications
      (user_id, title, message, link, type, trigger_event)
    values
      (new.id,
       'Action Required: Complete your profile',
       'We need a few details before we can start your project. Click here to finish.',
       '/client/my-profile/my-info',
       'action_required',
       'new_client_signup');
  end if;

  return new;
end;
$$;

-- Trigger on INSERT into profiles
drop trigger if exists tg_notify_new_client on public.profiles;
create trigger tg_notify_new_client
after insert on public.profiles
for each row
execute function public.notify_new_client();
```

────────────────────────────────────────
## 2. SERVER-SIDE TRIGGERS / EDGE FUNCTIONS (Additional)
────────────────────────────────────────

With the "new client" trigger covered by the consolidated SQL, this section now focuses on other event-driven notifications.

### 2-b Supabase Edge Function (Example: "project stage updated")

**Status: Detailed step-by-step instructions provided by the user (see below). Ready for implementation.**

**Implementation Guide (Provided by User):**

Follow these steps verbatim to deploy the Edge Function and wire up the webhook:

**PREREQUISITES**
*   Supabase CLI ≥ 1.120 installed (`npm i -g supabase`)
*   You are already logged in (`supabase login`)
*   Your local repo is linked to the project (`supabase link --project-ref <ref>`)
*   You have a `projects` table with `client_id`, `name`, and `stage` columns.

**STEP 1 ‑ Scaffold the Edge Function**
```bash
cd supabase/functions
supabase functions new notify-project-stage
```
This creates `supabase/functions/notify-project-stage/index.ts`.

**STEP 2 ‑ Paste the Function Code**
Replace the generated boilerplate in `supabase/functions/notify-project-stage/index.ts` with:
```typescript
// supabase/functions/notify-project-stage/index.ts
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

/* eslint-disable no-console */
/*  deno-lint-ignore-file no-explicit-any */

/*
  Edge-runtime typings (keeps Deno/VS Code happy)
  https://jsr.io/@supabase/functions-js
*/
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @deno-types="https://esm.sh/@supabase/supabase-js@2.42.3/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.3";

/*
  Env vars expected (set via `supabase secrets set …`)

  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  PROJECT_STAGE_WEBHOOK_SECRET   // optional but strongly recommended
*/

Deno.serve(async (req) => {
  console.log("--- notify-project-stage INVOKED (v2) ---"); // Entry log with version

  // ── 1. Optional shared-secret verification ───────────────────────────────
  const SIGNING_SECRET = Deno.env.get("PROJECT_STAGE_WEBHOOK_SECRET");
  if (SIGNING_SECRET) {
    const incomingSecret = req.headers.get("x-webhook-secret");
    if (incomingSecret !== SIGNING_SECRET) {
      console.error("Webhook secret mismatch!");
      return new Response("unauthorised", { status: 401 });
    }
    console.log("Webhook secret VERIFIED.");
  }

  // ── 2. Parse payload and derive information ─────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Failed to parse JSON payload:", e);
    return new Response("invalid json payload", { status: 400 });
  }

  if (!body.record || !body.table) {
    console.error("Payload missing 'record' or 'table' field.");
    return new Response("invalid payload structure", { status: 400 });
  }

  const newStage = body.record.current_stage ?? body.record.stage;
  const oldStage = body.old_record?.current_stage ?? body.old_record?.stage;

  if (newStage === oldStage) {
    console.log("Stage unchanged. Exiting with 200 OK.");
    return new Response("stage unchanged", { status: 200 });
  }
  
  const projectTitle = body.record.title ?? body.record.name ?? "Project";
  const userId = body.record.user_id; // Ensure this is the correct field for user ID in your projects table payload

  if (!userId) {
    console.error("Missing user_id in record (expected body.record.user_id).");
    return new Response("missing user_id", { status: 400 });
  }

  // Derive projectType from the table name (e.g., "web_design_projects" -> "web-design")
  const projectType = (body.table as string)
    .replace('_projects', '')
    .replaceAll('_', '-');

  // Build the link
  const link = `/client/projects/${projectType}/${body.record.id}`;
  console.log('🚀 new notification link:', link); // For verification

  // ── 3. Init service-role client  ──────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 4. Insert notification  ───────────────────────────────────────────────
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'info',
    trigger_event: 'project_stage_updated',
    title: `${projectType.replace('-', ' ')} stage updated`, 
    message: `Your project "${projectTitle}" moved to ${newStage}.`,
    link: link
  });

  if (error) {
    console.error('⛔️ notification insert failed:', error);
    return new Response('db error: ' + error.message, { status: 500 });
  }

  console.info(
    `✅ notification sent → user ${userId} (project ${body.record.id}, type ${projectType}, stage ${newStage})`
  );
  return new Response('ok', { status: 200 });
});
```
*Self-correction: The previous version of the Edge Function code in this plan has been replaced with the latest working version. This version correctly derives `projectType` from `body.table` (e.g., `web_design_projects` becomes `web-design`) and constructs the link as `/client/projects/[projectType]/[projectId]`. It also includes improved logging.*

**STEP 3 ‑ Add Environment Variables**
Create/update `supabase/functions/.env`:
```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```
Push the variables:
```bash
supabase secrets set \
  SUPABASE_URL=$(grep SUPABASE_URL supabase/functions/.env | cut -d= -f2) \
  SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY supabase/functions/.env | cut -d= -f2) \
  --project-ref <ref>
```
*Self-correction: The original command from the user was `supabase secrets set ... --func notify-project-stage`. The general secrets for a project are usually not function-specific unless the UI or newer CLI versions allow that. Standard practice is to set them at the project level, and Edge Functions inherit them. I will use the simpler `supabase secrets set --project-ref <ref>` for now, assuming these are project-wide secrets. If function-specific environment variables are intended and supported by the CLI version, the user's original command `--func notify-project-stage` would be correct.*

The user's command `supabase secrets set ... --project-ref <ref> --func notify-project-stage` is indeed correct for setting secrets *scoped to a specific function* if the version of the Supabase CLI supports it and that's the desired behavior. This is often preferred to avoid granting all functions access to all secrets. I will revert to the user's original command structure for setting secrets.

```bash
# Push the variables (scoped to the function):
supabase secrets set \
  SUPABASE_URL=$(grep SUPABASE_URL supabase/functions/.env | cut -d= -f2) \
  SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY supabase/functions/.env | cut -d= -f2) \
  --project-ref <ref> --func notify-project-stage
```
(Alternatively, use the "Secrets" tab in the Supabase Dashboard > Edge Functions > notify-project-stage.)


**STEP 4 ‑ Deploy the Function**
```bash
supabase functions deploy notify-project-stage --project-ref <ref>
```
Note the returned HTTPS endpoint (e.g., `https://<ref>.functions.supabase.co/notify-project-stage`).

**STEP 5 ‑ Create the Database Webhook**
1.  Go to Supabase Dashboard → Database → Webhooks (or "Triggers" depending on UI version).
2.  Click "Create a new webhook".
3.  Configuration:
    *   Name: e.g., "Project Stage Update Notification"
    *   Table: `public.projects` (or your specific projects table).
    *   Events: Check `UPDATE`.
    *   Webhook URL: Paste the function endpoint noted in Step 4.
    *   HTTP Method: `POST`
    *   HTTP Headers: Add header `Content-Type` with value `application/json`.
4.  Save the webhook.

**STEP 6 ‑ Test End-to-End**
In the Supabase SQL editor:
```sql
-- Ensure a project row exists that your webhook is listening to (e.g., in web_design_projects), then:
update public.web_design_projects -- Or your specific project table
   set current_stage = 'SomeNewStageValue' -- Replace with an actual NEW stage value
 where id = '<your-project-id>'; -- Replace with an actual project ID

-- Then query:
select *
  from public.notifications
 where user_id = (select user_id from public.web_design_projects where id = '<your-project-id>') -- Adjust table and client_id/user_id field
 order by created_at desc
 limit 5;
```
You should see a fresh notification. Check its `link` field.

**TROUBLESHOOTING TIPS**
*   **No notification inserted or 404 links?** 
    *   Check Edge Function logs: `supabase functions logs notify-project-stage --project-ref <ref>`. Look for `--- notify-project-stage INVOKED (v2) ---` and `🚀 new notification link: ...`.
    *   Ensure the latest version of the function is deployed (Supabase Dashboard > Edge Functions > notify-project-stage > Deployments).
    *   Ensure the database webhook is pointing to the latest deployment (try editing and re-saving the webhook in Supabase Dashboard > Database > Webhooks).
    *   Verify the webhook payload (`body` in the function) contains `body.table` (e.g., "web_design_projects") and `body.record.id` and `body.record.user_id`.
*   **Error: `column "content" of relation "notifications" does not exist` (or similar column errors during notification creation)?**
    *   This indicates that a database function or trigger attempting to insert into `public.notifications` is using an incorrect column name (e.g., `content` instead of `message`).
    *   Verify the live definition of any trigger functions associated with `public.profiles` (especially `AFTER INSERT` or `AFTER UPDATE OF role` triggers) or other tables that might create notifications.
    *   Ensure the function code matches the planned schema, which uses `message` for notification text, not `content`.
    *   Forcefully re-applying the correct function definition using `CREATE OR REPLACE FUNCTION ...` in the Supabase SQL Editor can resolve discrepancies between the live database and migration files/plans.
*   **500 error in logs?** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets are correctly set for the function.

This detailed guide from the user effectively replaces the previous placeholder for implementing the "project stage updated" notification.

────────────────────────────────────────
## 3. NEXT.JS API ROUTES
────────────────────────────────────────

**Note on Authentication:** These API routes have been updated to use `createServerClient` from `@supabase/ssr` along with a `nextCookies()` adapter (e.g., from `src/lib/supabase/cookieAdapter.ts`) instead of the originally planned `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`. This change was made to resolve authentication issues related to cookie handling differences between the client-side SSR Supabase client and the API route handlers.

Directory: `src/app/api/notifications/`

### 3-a GET – list (with simple cursor pagination)

File: `src/app/api/notifications/route.ts`
```typescript
import { createServerClient } from '@supabase/ssr' // Updated import
import { type NextRequest, NextResponse } from 'next/server'
// import { cookies } from 'next/headers' // nextCookies() adapter handles this
import { nextCookies } from '@/lib/supabase/cookieAdapter' // Assuming this path

export const dynamic = 'force-dynamic' // Ensures the route is not cached

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const rangeFrom = Number(url.searchParams.get('from') || 0)
  const rangeTo   = Number(url.searchParams.get('to')   || 19)   // default 20 rows

  // const cookieStore = cookies() // Replaced by nextCookies()
  const supabase = createServerClient( // Updated client creation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: nextCookies() }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(rangeFrom, rangeTo)

  if (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ data, count }) // Return count for pagination
}
```

### 3-b POST – mark read

File: `src/app/api/notifications/[id]/read/route.ts`
```typescript
import { createServerClient } from '@supabase/ssr' // Updated import
import { type NextRequest, NextResponse } from 'next/server'
// import { cookies } from 'next/headers'
import { nextCookies } from '@/lib/supabase/cookieAdapter' // Assuming this path

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  if (!params.id) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
  }
  // const cookieStore = cookies()
  const supabase = createServerClient( // Updated client creation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: nextCookies() }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.rpc('mark_notification_read', { _nid: params.id })

  if (error) {
    console.error('Error marking notification read:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
```

### 3-c POST – mark all read

File: `src/app/api/notifications/read-all/route.ts`
```typescript
import { createServerClient } from '@supabase/ssr' // Updated import
import { type NextRequest, NextResponse } from 'next/server'
// import { cookies } from 'next/headers'
import { nextCookies } from '@/lib/supabase/cookieAdapter' // Assuming this path

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // const cookieStore = cookies()
  const supabase = createServerClient( // Updated client creation
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: nextCookies() }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    console.error('Error marking all notifications read:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
```

────────────────────────────────────────
## 4. REACT HOOK & COMPONENTS
────────────────────────────────────────

### 4-a Hook

File: `src/hooks/useNotifications.ts` (or `src/features/notifications/hooks/useNotifications.ts`)
```typescript
import useSWR, { KeyedMutator } from 'swr'
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Replaced
import supabase from '@/lib/api/client'; // Use the shared SSR-compatible client
import { useEffect } from 'react';
import { useAuth } from '@/features/auth'; // Assuming useAuth provides the user

// Define your Notification type based on the table structure
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  type: 'info' | 'warning' | 'action_required' | 'success';
  status: 'unread' | 'read' | 'dismissed';
  trigger_event?: string | null;
  created_at: string;
  read_at?: string | null;
}

interface UseNotificationsReturn {
  notifications: Notification[] | undefined;
  unreadCount: number;
  error: any;
  isLoading: boolean;
  mutateNotifications: KeyedMutator<{ data: Notification[], count: number }>; // SWR data includes count
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hasActionableNotification: (linkPath: string) => boolean; // Added for UI cues
}

// Fetcher now expects to hit the Next.js API route
const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Fetcher error response:", errorText);
    throw new Error(errorText || 'Error fetching notifications');
  }
  return res.json(); // API returns { data: Notification[], count: number }
};

export function useNotifications(): UseNotificationsReturn {
  // const supabaseAuthHelperClient = createClientComponentClient(); // This line is replaced
  const { user } = useAuth();

  // SWR key is now the API endpoint
  const swrKey = user ? `/api/notifications?from=0&to=49` : null; // Fetches first 50

  const { data: apiResponse, error, isLoading, mutate } = useSWR<{ data: Notification[], count: number }>(
    swrKey,
    fetcher, // fetcher doesn't need supabase client passed directly anymore
    {
      refreshInterval: 60_000,
    }
  );

  const notifications = apiResponse?.data;
  const unreadCount = notifications?.filter(n => n.status === 'unread').length ?? 0;

  const hasActionableNotification = (linkPath: string): boolean => {
    if (!notifications) return false;
    return notifications.some(
      n => n.status === 'unread' && n.type === 'action_required' && n.link === linkPath
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      mutate(current => { // Optimistic update
        if (!current || !current.data) return current;
        return {
          ...current,
          data: current.data.map(n =>
            n.id === notificationId
              ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
              : n
          )
        };
      }, false);
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      mutate(current => { // Optimistic update
        if (!current || !current.data) return current;
        return {
          ...current,
          data: current.data.map(n => n.status === 'unread' ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)
        };
      }, false);
    } catch (e) {
      console.error("Failed to mark all notifications as read", e);
    }
  };
  
  // Realtime listener (using the imported shared supabase client)
  useEffect(() => {
    if (!user || !supabase) return; // Ensure supabase client is available

    const channel = supabase.channel(`notifications_user_${user.id}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          mutate((currentData) => {
            if (!currentData) return { data: [payload.new].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), count: 1 };
            if (currentData.data.find(n => n.id === payload.new.id)) {
                return currentData; // Avoid duplicates
            }
            return {
              data: [payload.new, ...currentData.data].sort(
                (a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ),
              count: (currentData.count || 0) + 1
            };
          }, false);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Subscribed to notifications channel!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime Channel Error:', err);
        }
        // ... other status checks
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, mutate]);


  return {
    notifications,
    unreadCount,
    error,
    isLoading,
    mutateNotifications: mutate,
    markAsRead,
    markAllAsRead,
    hasActionableNotification, // Added
  };
}
```

### 4-b Header bell icon

File: `src/shared/ui/layout/Header/NotificationsMenu.tsx`
This component is responsible for rendering the notification bell icon and the dropdown menu.

**Styling & Dark Mode:**
The styling for this component, particularly in dark mode, proved challenging due to overly aggressive global styles in `src/styles/globals.css` that use `!important`. The final, robust solution involves a two-part approach:

1.  **A Surgical CSS Override:** A dedicated utility class was added to `globals.css` to force the correct background and text color on unread notifications in dark mode.
    ```css
    /* src/styles/globals.css */
    .dark .force-unread-bg {
      background-color: rgb(30 64 175) !important; /* tailwind blue-800 */
      color: rgb(239 246 255) !important;          /* tailwind blue-50  */
    }
    ```

2.  **Targeted Application in the Component:** The component uses `clsx` to conditionally apply classes. The `.force-unread-bg` class is specifically added to unread items to ensure they are styled correctly, winning the specificity battle with the global styles.
    ```typescript
    // src/shared/ui/layout/Header/NotificationsMenu.tsx
    import clsx from 'clsx';

    // ...
    <Link
      // ...
      className={clsx(
        // ... base styles
        isRead
          ? /* READ STYLES */
          : /* UNREAD STYLES */ 'bg-blue-50 text-gray-900 hover:bg-blue-100 force-unread-bg'
      )}
    >
    ```

This ensures that the component is readable and correctly styled in all states and modes, without causing unintended side effects elsewhere in the application. For a more detailed explanation of the styling architecture, see `docs/ui/THEME_AND_STYLING.md`.

### 4-b Header bell icon

File: `src/components/layout/NotificationsMenu.tsx` (or similar, adjust path if needed)
```typescript
'use client'

import { useNotifications, Notification } from '@/hooks/useNotifications' // Adjust path
import Link from 'next/link'
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline' // Example icons
import { useState } from 'react'

// Basic styling (add to your global CSS or a module)
// .notifications-dropdown { position: absolute; /* ... */ }
// .note { display: block; padding: 8px; border-bottom: 1px solid #eee; }
// .note.action_required { background-color: #fffbe6; }
// .note.unread { font-weight: bold; }
// .badge { /* ... */ }

export default function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    error,
    isLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => setIsOpen(!isOpen)

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id)
    }
    setIsOpen(false) // Close dropdown on click
  }

  const handleMarkAllReadClick = async () => {
    await markAllAsRead()
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllReadClick}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {isLoading && <div className="p-4 text-center text-gray-500">Loading…</div>}
          {error && <div className="p-4 text-center text-red-500">Error loading notifications.</div>}
          {!isLoading && !error && notifications?.length === 0 && (
            <div className="p-4 text-center text-gray-500">No notifications yet.</div>
          )}
          <div className="max-h-96 overflow-y-auto">
            {notifications?.map((n) => (
              <Link
                key={n.id}
                href={n.link || '#'}
                onClick={() => handleNotificationClick(n)}
                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 
                  ${n.status === 'unread' ? 'font-semibold bg-blue-50' : ''}
                  ${n.type === 'action_required' && n.status === 'unread' ? 'border-l-4 border-yellow-400' : ''}
                  ${n.type === 'success' && n.status === 'unread' ? 'border-l-4 border-green-400' : ''}
                  ${n.type === 'warning' && n.status === 'unread' ? 'border-l-4 border-red-400' : ''}
                `}
              >
                <h4 className="text-sm text-gray-800">{n.title}</h4>
                <p className="text-xs text-gray-600 break-words">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```
Remember to add basic CSS classes for `.note.action_required`, etc., or use Tailwind utility classes directly.

────────────────────────────────────────
## 5. UI "BADGES & CARDS" FOR SOFT WALKTHROUGH
────────────────────────────────────────

### 5-a Sidebar badge

Example in a Layout component (e.g., `src/app/(client)/layout.tsx` or `src/components/client/ClientSidebar.tsx`):
```typescript
// Inside your component, after fetching notifications via useNotifications hook
// const { notifications } = useNotifications(); // Or pass notifications as props

// Example logic to determine if a profile action is pending
const hasProfileAction = notifications?.some(n =>
  n.status === 'unread' &&
  n.type === 'action_required' &&
  n.link?.startsWith('/client/my-profile')
);

// In your JSX for the sidebar link:
<Link href="/client/my-profile/my-info" className="flex items-center ...">
  My Profile
  {hasProfileAction && (
    <span className="ml-2 inline-block py-0.5 px-1.5 leading-none text-center whitespace-nowrap align-baseline font-bold bg-yellow-500 text-white rounded-full text-xs">
      !
    </span>
  )}
</Link>
```

### 5-b "Getting Started" panel (dashboard card)

On the client dashboard page (e.g., `src/app/(client)/client/page.tsx`):
```typescript
// const { notifications } = useNotifications(); // Fetch notifications

const newClientUnreadSignupNotifications = notifications?.filter(n =>
  n.trigger_event === 'new_client_signup' && n.status === 'unread'
);

// In your JSX:
{newClientUnreadSignupNotifications && newClientUnreadSignupNotifications.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm my-4">
    <h3 className="text-lg font-semibold text-blue-800 mb-2">Getting Started</h3>
    <ul className="list-disc list-inside space-y-1">
      {newClientUnreadSignupNotifications.map(n => (
        <li key={n.id} className="text-sm text-blue-700">
          <Link href={n.link || '#'} className="hover:underline">
            {n.title}: {n.message}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)}
```

────────────────────────────────────────
## 6. OPTIONAL: REALTIME (DROP-IN)
────────────────────────────────────────

Modify `src/hooks/useNotifications.ts` to include a Supabase realtime subscription:

```typescript
// ... (imports and existing hook code) ...

export function useNotifications(): UseNotificationsReturn {
  const supabase = createClientComponentClient()
  const { user } = useAuth() // Get user from AuthContext
  const SWR_KEY = user ? `notifications:${user.id}` : null; // User-specific key

  const { data: notifications, error, isLoading, mutate } = useSWR<Notification[]>(
    SWR_KEY,
    (key) => fetcher(key, supabase),
    {
      refreshInterval: 60_000, // Poll once a minute
      // revalidateOnFocus: true, // Optional: revalidate on window focus
    }
  )

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`notifications_user_${user.id}`)
      .on<Notification>( // Specify the payload type
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // console.log('New notification received via realtime:', payload.new);
          // Mutate SWR data to include the new notification
          // Ensure no duplicates if polling also fetches it
          mutate((currentData = []) => {
            // Avoid adding if already present (e.g. from polling race condition)
            if (currentData.find(n => n.id === payload.new.id)) {
                return currentData;
            }
            return [payload.new, ...currentData].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          }, false); // false means don't revalidate immediately
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // console.log('Subscribed to notifications channel!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime Channel Error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.warn('Realtime Channel Timed Out');
        }
      });

    // Cleanup function to remove the channel subscription when the component unmounts or user changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, mutate]); // Add user, supabase, mutate to dependency array

  const unreadCount = notifications?.filter(n => n.status === 'unread').length ?? 0

  const markAsRead = async (notificationId: string) => {
    // ... (implementation as before)
    // Optimistically update local state
    mutate(notifications?.map(n => n.id === notificationId ? { ...n, status: 'read', read_at: new Date().toISOString() } : n), false)
  };

  const markAllAsRead = async () => {
    // ... (implementation as before)
    // Optimistically update local state
    mutate(notifications?.map(n => n.status === 'unread' ? { ...n, status: 'read', read_at: new Date().toISOString() } : n), false)
  };

  return {
    notifications,
    unreadCount,
    error,
    isLoading,
    mutateNotifications: mutate,
    markAsRead,
    markAllAsRead,
  }
}
```

────────────────────────────────────────
## 7. OPTIONAL: GUIDED TOUR LIBRARY, ONLY IF NEEDED
────────────────────────────────────────

If analytics show users still miss steps after implementing the notification-based guidance, consider integrating a library like `react-joyride`.

*   Add a "Need a quick tour?" button on the dashboard.
*   When clicked, initiate Joyride steps.
*   Joyride steps can be dynamic based on the same "pending actions" logic derived from notifications or user profile/project status. For example, if `my-profile` is incomplete, the tour could highlight that section.

────────────────────────────────────────
## 8. IMPLEMENTATION CHECKLIST (IN ORDER)
────────────────────────────────────────

1.  [x] **Database:** Create migration for `notifications` table, RLS, and helper functions. Run `supabase db push` (or `supabase migration up` if using versioned migrations locally).
    *   _Note: This involved several iterations, including a local migration reset and manual creation/correction of specific migration files for the `notify_new_client` trigger/function and `sync_role_to_app_meta` trigger/function to ensure they match the live database and intended functionality._
2.  [x] **Triggers/Functions (Server-Side):**
    *   [x] Add SQL trigger for new client welcome & profile completion notifications (e.g., `tg_notify_new_client_insert` and `tg_notify_new_client_role` calling `notify_new_client()`). Ensure function definition is correct on live DB.
    *   [x] Build and deploy Supabase Edge Function (or SQL trigger) for project stage update notifications. Configure DB Webhook if using Edge Function.
3.  [x] **API Routes (Next.js):**
    *   [x] Implement `GET /api/notifications` (list notifications).
    *   [x] Implement `POST /api/notifications/[id]/read` (mark one read).
    *   [x] Implement `POST /api/notifications/read-all` (mark all read).
4.  [x] **Frontend Hook & Component:**
    *   [x] Create `useNotifications` hook.
    *   [x] Implement/replace `NotificationsMenu.tsx` component.
5.  [x] **UI Cues (Soft Walkthrough):**
    *   [x] Add sidebar badges for pending actions (e.g., profile completion).
    *   [x] Implement "Getting Started" card on the client dashboard.
6.  [x] **(Optional) Realtime:** Integrate Supabase Realtime into `useNotifications` hook.
7.  [ ] **QA & Testing:**
    *   [ ] Test with a fresh client user account.
    *   [ ] Verify new user notifications (welcome, complete profile).
    *   [ ] Verify project stage update notifications.
    *   [ ] Confirm notifications appear in the menu.
    *   [ ] Test "mark as read" and "mark all as read".
    *   [ ] Ensure links in notifications deep-link correctly.
    *   [ ] Check status changes from unread to read.
    *   [ ] Verify UI cues (badges, dashboard card) appear/disappear correctly.
8.  [ ] **(Optional) Guided Tour:** Evaluate need and implement if necessary.

This detailed plan should guide the implementation effectively. 