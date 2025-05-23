-- Migration: Sync profile.role to auth.users.app_metadata.role

-- Function to sync the role
create or replace function public.sync_role_to_app_meta()
returns trigger
language plpgsql
security definer -- Important: Allows the function to update auth.users
-- Removed standalone set search_path = public; as it might be causing parsing issues with $$-quoting
as $$ 
begin
  update auth.users
     set raw_app_meta_data = jsonb_set(
           coalesce(raw_app_meta_data, '{}'::jsonb),
           '{role}',
           to_jsonb(new.role)
         )
   where id = new.id;
  return new;
end;
$$;

-- Trigger for when a profile row is first created
-- Ensures app_metadata.role is set immediately
drop trigger if exists trg_profile_role_insert on public.profiles;
create trigger trg_profile_role_insert
after insert on public.profiles
for each row
execute function public.sync_role_to_app_meta();

-- Trigger for when the role is changed later on an existing profile
drop trigger if exists trg_profile_role_update on public.profiles;
create trigger trg_profile_role_update
after update of role on public.profiles
for each row
when (new.role is distinct from old.role)
execute function public.sync_role_to_app_meta(); 