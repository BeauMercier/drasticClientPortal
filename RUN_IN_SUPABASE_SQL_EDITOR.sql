create or replace function public.notify_new_client()
returns trigger
language plpgsql
security definer
set search_path = public -- It's fine to set it here for the function's context
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
       'Thanks for joining. Let''s get your project off on the right foot.', -- Ensure correct apostrophe
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

-- Just in case, let's re-grant execute. This is often unnecessary for SECURITY DEFINER triggers
-- owned by postgres, but doesn't hurt if there was a permission glitch.
-- The key owner/executor is postgres (or the function owner) due to SECURITY DEFINER.
GRANT EXECUTE ON FUNCTION public.notify_new_client() TO postgres, service_role; 