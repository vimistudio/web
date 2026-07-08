-- Client-side team invites: let a signed-in client (role='client') invite
-- teammates to their OWN client, and see/revoke their own pending invites.
--
-- Uses the existing SECURITY DEFINER helpers is_admin() and
-- current_user_client_id() (see 20260413_fix_profiles_rls_leak.sql), which are
-- search_path-pinned to avoid the recursive RLS evaluation a self-referencing
-- subquery would trigger.
--
-- These policies are additive and strictly scoped to the caller's own
-- client_id with role='client'. Existing admin policies on invited_emails are
-- left untouched. Admins have a null client_id, so current_user_client_id()
-- returns null for them and they never match these client-scoped checks.

alter table public.invited_emails enable row level security;

-- Clients can invite teammates to their own client only, as role 'client'.
drop policy if exists "Clients can invite own team" on public.invited_emails;
create policy "Clients can invite own team"
  on public.invited_emails
  for insert
  to authenticated
  with check (
    role = 'client'
    and client_id = public.current_user_client_id()
  );

-- Clients can see pending invites for their own client (to list them).
drop policy if exists "Clients can view own team invites" on public.invited_emails;
create policy "Clients can view own team invites"
  on public.invited_emails
  for select
  to authenticated
  using (
    client_id = public.current_user_client_id()
  );

-- Clients can revoke pending invites for their own client.
drop policy if exists "Clients can revoke own team invites" on public.invited_emails;
create policy "Clients can revoke own team invites"
  on public.invited_emails
  for delete
  to authenticated
  using (
    role = 'client'
    and client_id = public.current_user_client_id()
  );
