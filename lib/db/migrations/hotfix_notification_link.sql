create or replace function public.notify_new_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'client' then
    insert into public.notifications
      (user_id, title, message, link, type, trigger_event)
    values
      (new.id,
       'Welcome to the Portal!',
       'Thanks for joining. Let''s get your project off on the right foot.',
       null,
       'info',
       'new_client_signup');

    insert into public.notifications
      (user_id, title, message, link, type, trigger_event)
    values
      (new.id,
       'Action Required: Complete your profile',
       'We need a few details before we can start your project. Click here to finish.',
       '/client/my-profile',
       'action_required',
       'new_client_signup');
  end if;

  return new;
end;
$$; 