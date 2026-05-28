create table if not exists event_frames (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  frame_url text not null,
  layout_config jsonb not null,
  preview_url text,
  is_default boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table final_outputs
add column if not exists frame_id uuid,
add column if not exists frame_name text;
