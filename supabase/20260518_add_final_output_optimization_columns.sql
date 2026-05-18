alter table public.final_outputs
  add column if not exists thumbnail_path text,
  add column if not exists thumbnail_url text,
  add column if not exists file_size bigint,
  add column if not exists thumbnail_size bigint,
  add column if not exists mime_type text,
  add column if not exists width integer,
  add column if not exists height integer;
