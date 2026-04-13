-- Self-healing invite consumption.
--
-- Problem: handle_new_user trigger only fires AFTER INSERT on auth.users.
-- A user who signs in BEFORE being invited (or who was invited, removed,
-- and re-invited) ends up with a profile but no client_id — and signing
-- in again won't fix it because the trigger doesn't re-run.
--
-- Solution: a SECURITY DEFINER function the portal layout calls on each
-- load if the user has profile.client_id = NULL. It looks up any pending
-- invite for the user's email and consumes it (sets client_id + role,
-- deletes the invite row). Idempotent — if there's no pending invite
-- it's a no-op.

create or replace function public.claim_invite()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_client_id uuid;
  v_role text;
begin
  -- Email of the calling authenticated user
  select u.email into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is null then
    return false;
  end if;

  -- Look for a pending invite addressed to this email
  select ie.client_id, ie.role::text into v_client_id, v_role
  from public.invited_emails ie
  where ie.email = lower(v_email)
  limit 1;

  if v_client_id is null then
    return false;
  end if;

  -- Link this user's profile to the invited client + role.
  -- Only updates if profile currently lacks a client_id, so we never
  -- overwrite an existing membership.
  update public.profiles
  set client_id = v_client_id,
      role = v_role::public.user_role
  where id = auth.uid()
    and client_id is null;

  -- Consume the invite (one-time use)
  delete from public.invited_emails where email = lower(v_email);

  return true;
end;
$$;

grant execute on function public.claim_invite() to authenticated;
