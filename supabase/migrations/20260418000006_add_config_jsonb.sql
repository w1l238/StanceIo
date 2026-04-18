-- Store the full visual configuration as a flexible JSON blob.
-- Covers paint hex, rim color, mirror color, camber, window tint, and background
-- alongside the existing structured columns (ride_height_mm, mod_option FKs).
alter table public.saved_configurations
  add column if not exists config jsonb not null default '{}';
