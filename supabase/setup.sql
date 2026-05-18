-- Run this once in the Supabase SQL editor for the photobooth MVP.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photobooth-final-images',
  'photobooth-final-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.final_outputs (
  id text primary key,
  event_id text not null,
  session_id text,
  image_path text not null,
  thumbnail_path text,
  image_url text not null,
  thumbnail_url text,
  file_size bigint,
  thumbnail_size bigint,
  mime_type text,
  width integer,
  height integer,
  download_count integer not null default 0,
  upload_status text not null default 'success',
  created_at timestamptz not null default now()
);

alter table public.final_outputs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'final_outputs' and policyname = 'Allow public final output reads'
  ) then
    create policy "Allow public final output reads" on public.final_outputs for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'final_outputs' and policyname = 'Allow public final output inserts'
  ) then
    create policy "Allow public final output inserts" on public.final_outputs for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'final_outputs' and policyname = 'Allow public final output updates'
  ) then
    create policy "Allow public final output updates" on public.final_outputs for update using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow public final image reads'
  ) then
    create policy "Allow public final image reads" on storage.objects for select using (bucket_id = 'photobooth-final-images');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow public final image uploads'
  ) then
    create policy "Allow public final image uploads" on storage.objects for insert with check (bucket_id = 'photobooth-final-images');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow public final image upserts'
  ) then
    create policy "Allow public final image upserts" on storage.objects for update using (bucket_id = 'photobooth-final-images') with check (bucket_id = 'photobooth-final-images');
  end if;
end $$;
