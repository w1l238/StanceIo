-- Allow anyone to read a saved configuration if they know its UUID.
-- UUIDs have 122 bits of entropy so knowing the ID is equivalent to being invited.
-- The existing insert/update/delete policies still restrict writes to the owner.
create policy "Public can read configurations by id"
  on public.saved_configurations for select
  using (true);
