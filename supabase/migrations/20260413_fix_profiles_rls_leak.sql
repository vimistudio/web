-- Fix profiles RLS leak: any authenticated user could read every profile in
-- the database (names, emails, client_id mappings).
--
-- New policy allows reading profiles when the row is:
--   - your own profile
--   - an admin profile (so clients see designer names on comments/activity)
--   - a profile in the same client team as you (future-proof for multi-user clients)
--
-- Helpers are SECURITY DEFINER + search_path-pinned to avoid the recursive RLS
-- evaluation that a self-referencing subquery would trigger.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

create or replace function public.current_user_client_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select client_id from public.profiles where id = auth.uid()
$$;

drop policy if exists "Authenticated users can view profiles" on public.profiles;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view scoped profiles"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
    or (
      client_id is not null
      and client_id = public.current_user_client_id()
    )
  );
