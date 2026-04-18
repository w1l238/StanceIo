create table public.cars (
  id            uuid primary key default gen_random_uuid(),
  make          text not null,
  model         text not null,
  generation    text not null,
  base_asset_url text not null
);

comment on table public.cars is 'Supported car models and their base 3D asset.';
