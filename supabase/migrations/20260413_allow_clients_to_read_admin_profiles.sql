-- Extend profiles RLS so clients can read admin profile rows.
-- Admins are the point of contact (comments, activity, first-sign-in
-- notification lookups), and their email/name is inherently meant to be
-- visible to clients. Restores behaviour that PR #73 accidentally removed
-- when tightening the leaky catch-all policy.

drop policy if exists "Users can view scoped profiles" on public.profiles;

create policy "Users can view scoped profiles"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
    or role = 'admin'
    or (
      client_id is not null
      and client_id = public.current_user_client_id()
    )
  );
