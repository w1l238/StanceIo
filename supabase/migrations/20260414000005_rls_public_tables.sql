-- Enable RLS on read-only reference tables.
-- Anyone can read; no client-side writes (inserts/updates/deletes
-- are admin-only via the service role key).

alter table public.cars enable row level security;

create policy "Public read access"
  on public.cars for select
  using (true);


alter table public.mod_options enable row level security;

create policy "Public read access"
  on public.mod_options for select
  using (true);
