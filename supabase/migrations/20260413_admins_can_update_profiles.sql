-- Allow admins to update any profile row (e.g., set client_id to null when
-- removing a member from a client). Reuses the is_admin() helper from
-- 20260413_fix_profiles_rls_leak.

create policy "Admins can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
