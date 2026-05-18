insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photobooth-frames',
  'photobooth-frames',
  true,
  10485760,
  array['image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  event_date date,
  frame_url text,
  layout_config jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Allow public event reads'
  ) then
    create policy "Allow public event reads" on public.events for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Allow authenticated event inserts'
  ) then
    create policy "Allow authenticated event inserts" on public.events for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Allow authenticated event updates'
  ) then
    create policy "Allow authenticated event updates" on public.events for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'Allow authenticated event deletes'
  ) then
    create policy "Allow authenticated event deletes" on public.events for delete to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow public frame reads'
  ) then
    create policy "Allow public frame reads" on storage.objects for select using (bucket_id = 'photobooth-frames');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow authenticated frame uploads'
  ) then
    create policy "Allow authenticated frame uploads" on storage.objects for insert to authenticated with check (bucket_id = 'photobooth-frames');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow authenticated frame upserts'
  ) then
    create policy "Allow authenticated frame upserts" on storage.objects for update to authenticated using (bucket_id = 'photobooth-frames') with check (bucket_id = 'photobooth-frames');
  end if;
end $$;
