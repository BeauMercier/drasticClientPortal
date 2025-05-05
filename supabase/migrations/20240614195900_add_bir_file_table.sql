-- Migration script to create the bir_file table

create table public.bir_file (
  id                uuid primary key default gen_random_uuid(),
  bir_id            uuid references public.business_information_requests(id)
                     on delete cascade not null, -- Added not null constraint
  file_type         text not null,         -- e.g. 'logo', 'style_guide', 'photo', 'certificate', 'misc'
  original_name     text not null,
  storage_path      text not null unique,  -- Added unique constraint to prevent duplicates
  mime_type         text not null,
  size_bytes        integer not null,
  uploaded_at       timestamptz not null default now()
);

-- Add comment on the table
comment on table public.bir_file is 'Stores metadata for files uploaded specifically for a Business Information Request.';

-- Add comments on columns for clarity
comment on column public.bir_file.bir_id is 'Links to the parent Business Information Request.';
comment on column public.bir_file.file_type is 'Categorizes the purpose of the file (e.g., logo, photo).';
comment on column public.bir_file.original_name is 'The original filename as uploaded by the user.';
comment on column public.bir_file.storage_path is 'The path to the file object within the storage bucket (e.g., bir-files/{bir_id}/{uuid}.ext).';
comment on column public.bir_file.mime_type is 'The MIME type of the uploaded file (e.g., image/png).';
comment on column public.bir_file.size_bytes is 'The size of the file in bytes.';
comment on column public.bir_file.uploaded_at is 'Timestamp when the file was uploaded.';


-- Create an index on bir_id for faster lookups
create index idx_bir_file_bir_id on public.bir_file(bir_id);

-- Grant usage for the sequence used by gen_random_uuid, if needed (often granted by default)
-- grant usage on schema public to authenticated;
-- grant select on table pg_catalog.pg_sequences to authenticated; 