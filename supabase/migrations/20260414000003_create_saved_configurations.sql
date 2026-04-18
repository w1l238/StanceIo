create table public.saved_configurations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  car_id           uuid not null references public.cars(id),
  wheel_id         uuid references public.mod_options(id),
  front_bumper_id  uuid references public.mod_options(id),
  rear_bumper_id   uuid references public.mod_options(id),
  paint_id         uuid references public.mod_options(id),
  ride_height_mm   numeric(6, 1) not null default 0,
  name             text not null default 'My Build',
  created_at       timestamptz not null default now()
);

comment on table public.saved_configurations is 'User-saved car builds.';
comment on column public.saved_configurations.ride_height_mm is 'Drop in mm from stock ride height. 0 = stock.';

-- RLS
alter table public.saved_configurations enable row level security;

create policy "Users can read their own configurations"
  on public.saved_configurations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own configurations"
  on public.saved_configurations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own configurations"
  on public.saved_configurations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own configurations"
  on public.saved_configurations for delete
  using (auth.uid() = user_id);
