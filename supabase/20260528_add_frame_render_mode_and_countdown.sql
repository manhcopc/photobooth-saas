alter table event_frames
add column if not exists render_mode text default 'overlay_only',
add column if not exists background_url text,
add column if not exists overlay_url text;

update event_frames
set overlay_url = coalesce(overlay_url, frame_url),
    render_mode = coalesce(render_mode, 'overlay_only')
where overlay_url is null or render_mode is null;

alter table events
add column if not exists default_countdown_seconds int default 5,
add column if not exists allow_user_change_countdown boolean default true;

alter table final_outputs
add column if not exists frame_render_mode text;
