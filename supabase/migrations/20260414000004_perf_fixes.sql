-- ============================================================
-- Performance fixes flagged by Supabase Performance Advisor
-- ============================================================


-- 1. Fix RLS policies on saved_configurations
--    Replace auth.uid() with (select auth.uid()) so Postgres
--    evaluates it once per query instead of once per row.
-- ============================================================

drop policy "Users can read their own configurations"   on public.saved_configurations;
drop policy "Users can insert their own configurations" on public.saved_configurations;
drop policy "Users can update their own configurations" on public.saved_configurations;
drop policy "Users can delete their own configurations" on public.saved_configurations;

create policy "Users can read their own configurations"
  on public.saved_configurations for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own configurations"
  on public.saved_configurations for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own configurations"
  on public.saved_configurations for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own configurations"
  on public.saved_configurations for delete
  using ((select auth.uid()) = user_id);


-- 2. Add indexes for all unindexed foreign keys
-- ============================================================

create index on public.mod_options (car_id);

create index on public.saved_configurations (user_id);
create index on public.saved_configurations (car_id);
create index on public.saved_configurations (wheel_id);
create index on public.saved_configurations (front_bumper_id);
create index on public.saved_configurations (rear_bumper_id);
create index on public.saved_configurations (paint_id);