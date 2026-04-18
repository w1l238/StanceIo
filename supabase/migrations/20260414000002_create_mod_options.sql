create type public.mod_category as enum (
  'wheels',
  'front_bumper',
  'rear_bumper',
  'paint'
);

create table public.mod_options (
  id            uuid primary key default gen_random_uuid(),
  car_id        uuid not null references public.cars(id) on delete cascade,
  category      public.mod_category not null,
  name          text not null,
  brand         text not null,
  asset_url     text,
  thumbnail_url text,
  buy_url       text,
  price         numeric(10, 2),
  sort_order    integer not null default 0
);

comment on table public.mod_options is 'Swappable mod parts per car and category.';
comment on column public.mod_options.asset_url     is 'Path to GLB file in /public/assets/';
comment on column public.mod_options.thumbnail_url is 'Path to thumbnail image for the UI card.';
comment on column public.mod_options.price         is 'Optional display price. NULL means price unavailable.';
