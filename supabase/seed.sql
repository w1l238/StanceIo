-- ============================================================
-- Seed data for Stance.io MVP
-- ============================================================

-- Car
insert into public.cars (id, make, model, generation, base_asset_url) values
  ('00000000-0000-0000-0000-000000000001', 'Toyota / Subaru', 'GR86 / BRZ', 'ZN8/ZD8 (2022+)', '/assets/cars/gr86_base.glb');


-- ============================================================
-- Mod options — Wheels (3 options)
-- ============================================================
insert into public.mod_options (car_id, category, name, brand, asset_url, thumbnail_url, buy_url, price, sort_order) values
  (
    '00000000-0000-0000-0000-000000000001',
    'wheels', 'Volk TE37SL', 'Rays Engineering',
    '/assets/mods/wheels/te37sl.glb',
    '/assets/thumbnails/wheels/te37sl.jpg',
    null, null, 1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'wheels', 'Work Emotion CR Kiwami', 'Work Wheels',
    '/assets/mods/wheels/work_cr_kiwami.glb',
    '/assets/thumbnails/wheels/work_cr_kiwami.jpg',
    null, null, 2
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'wheels', 'Enkei RPF1', 'Enkei',
    '/assets/mods/wheels/enkei_rpf1.glb',
    '/assets/thumbnails/wheels/enkei_rpf1.jpg',
    null, null, 3
  );


-- ============================================================
-- Mod options — Front bumpers (3 options)
-- ============================================================
insert into public.mod_options (car_id, category, name, brand, asset_url, thumbnail_url, buy_url, price, sort_order) values
  (
    '00000000-0000-0000-0000-000000000001',
    'front_bumper', 'Rocket Bunny Ver.2 Front Bumper', 'TRA Kyoto',
    '/assets/mods/bumpers/front_rocket_bunny_v2.glb',
    '/assets/thumbnails/bumpers/front_rocket_bunny_v2.jpg',
    null, null, 1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'front_bumper', 'Varis Arising-I Front Bumper', 'Varis',
    '/assets/mods/bumpers/front_varis_arising1.glb',
    '/assets/thumbnails/bumpers/front_varis_arising1.jpg',
    null, null, 2
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'front_bumper', 'OEM+ Front Lip Spoiler', 'TRD',
    '/assets/mods/bumpers/front_trd_lip.glb',
    '/assets/thumbnails/bumpers/front_trd_lip.jpg',
    null, null, 3
  );


-- ============================================================
-- Mod options — Rear bumpers (3 options)
-- ============================================================
insert into public.mod_options (car_id, category, name, brand, asset_url, thumbnail_url, buy_url, price, sort_order) values
  (
    '00000000-0000-0000-0000-000000000001',
    'rear_bumper', 'Rocket Bunny Ver.2 Rear Bumper', 'TRA Kyoto',
    '/assets/mods/bumpers/rear_rocket_bunny_v2.glb',
    '/assets/thumbnails/bumpers/rear_rocket_bunny_v2.jpg',
    null, null, 1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'rear_bumper', 'Varis Arising-I Rear Bumper', 'Varis',
    '/assets/mods/bumpers/rear_varis_arising1.glb',
    '/assets/thumbnails/bumpers/rear_varis_arising1.jpg',
    null, null, 2
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'rear_bumper', 'OEM+ Rear Diffuser', 'TRD',
    '/assets/mods/bumpers/rear_trd_diffuser.glb',
    '/assets/thumbnails/bumpers/rear_trd_diffuser.jpg',
    null, null, 3
  );


-- ============================================================
-- Mod options — Paint / wrap (3 options)
-- asset_url is null for paint — color is applied via hex, no GLB swap
-- ============================================================
insert into public.mod_options (car_id, category, name, brand, asset_url, thumbnail_url, buy_url, price, sort_order) values
  (
    '00000000-0000-0000-0000-000000000001',
    'paint', 'Icy White', 'OEM',
    null,
    '/assets/thumbnails/paint/icy_white.jpg',
    null, null, 1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'paint', 'Trueno Blue', 'OEM',
    null,
    '/assets/thumbnails/paint/trueno_blue.jpg',
    null, null, 2
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'paint', 'Matte Black Wrap', 'Avery Dennison',
    null,
    '/assets/thumbnails/paint/matte_black.jpg',
    null, null, 3
  );
