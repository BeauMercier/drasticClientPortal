-- Migration: Update client notification logic to ensure notifications are sent only once
-- when a user first becomes a client (either on insert or on role update).

-- First, drop the existing trigger if it exists (optional, but good for idempotency)
drop trigger if exists tg_notify_new_client on public.profiles;
drop trigger if exists tg_notify_client_role_update on public.profiles;

-- Then, redefine the function to handle both INSERT and UPDATE scenarios
create or replace function public.notify_new_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if the new role is 'client' AND
  -- (it's an INSERT operation OR it's an UPDATE and the role actually changed to 'client')
  if new.role = 'client' and (TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and old.role is distinct from 'client')) then
    -- Welcome Notification
    insert into public.notifications
      (user_id, title, message, link, type, trigger_event)
    values
      (new.id,
       'Welcome to the Portal!',
       'Thanks for joining. Let''s get your project off on the right foot.',
       null,
       'info',
       'new_client_signup');

    -- Action Required: Complete Profile Notification
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

-- Recreate the trigger for INSERT operations
create trigger tg_notify_new_client
after insert on public.profiles
for each row
execute function public.notify_new_client();

-- Create a new trigger for UPDATE operations on the 'role' column
create trigger tg_notify_client_role_update
after update of role on public.profiles
for each row
when (new.role is distinct from old.role) -- Only fire if the role actually changes
execute function public.notify_new_client();

-- Grant execute on the function
grant execute on function public.notify_new_client() to postgres, service_role; 