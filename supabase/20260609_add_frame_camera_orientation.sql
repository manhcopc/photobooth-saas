alter table event_frames
add column if not exists preferred_camera_facing text default 'user',
add column if not exists preferred_orientation text default 'portrait';

update event_frames
set preferred_camera_facing = coalesce(preferred_camera_facing, 'user'),
    preferred_orientation = coalesce(preferred_orientation, 'portrait')
where preferred_camera_facing is null or preferred_orientation is null;
