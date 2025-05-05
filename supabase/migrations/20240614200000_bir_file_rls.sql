-- Enable RLS on the new table
alter table public.bir_file
  enable row level security;

-- Policies for SELECT / INSERT / DELETE / UPDATE

/* ----------  SELECT  ---------- */
create policy "client can read own files"
on public.bir_file
for select
using (
  exists (
    select 1
    from public.business_information_requests bir
    where bir.id = bir_file.bir_id
      and bir.client_id = auth.uid()           -- 👈 same owner
  )
);

/* ----------  INSERT  ---------- */
create policy "client can upload file to own BIR"
on public.bir_file
for insert
with check (
  exists (
    select 1
    from public.business_information_requests bir
    where bir.id = bir_file.bir_id
      and bir.client_id = auth.uid()
  )
);

/* ----------  DELETE  ---------- */
create policy "client can delete own file"
on public.bir_file
for delete
using (
  exists (
    select 1
    from public.business_information_requests bir
    where bir.id = bir_file.bir_id
      and bir.client_id = auth.uid()
  )
);

/* ----------  UPDATE (Optional) ---------- */
create policy "client can update own file"
on public.bir_file
for update
using (
  exists (
    select 1
    from public.business_information_requests bir
    where bir.id = bir_file.bir_id
      and bir.client_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.business_information_requests bir
    where bir.id = bir_file.bir_id
      and bir.client_id = auth.uid()
  )
);

-- Storage bucket policies
-- Applies to INSERT (upload) only
create policy "authenticated upload to bir-files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bir-files'
);

-- Note: SELECT policy for storage.objects is intentionally omitted
-- to keep the bucket private. Access relies on signed URLs.

-- Note: DELETE policy for storage.objects is omitted for now.
-- Add it if/when delete functionality is implemented client-side.
/*
create policy "authenticated delete own bir-files object"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bir-files'
  and storage.objects.owner = auth.uid() -- requires PG15+
);
*/ 