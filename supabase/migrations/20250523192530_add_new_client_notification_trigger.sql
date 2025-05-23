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

-- Grant execute on the function if not already covered
-- This might be needed if functions are restored without explicit grants
-- However, security definer functions are executable by their owner by default.
-- Granting to 'authenticated' might be useful if called via RPC by users, but this is a trigger.
-- Granting to service_role is good practice for functions used by the system.
grant execute on function public.notify_new_client() to postgres, service_role; 