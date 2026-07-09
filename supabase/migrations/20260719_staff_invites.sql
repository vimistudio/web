-- Staff invites (owner/staff tier). A Staff member is studio-wide (role='admin',
-- is_owner=false) and belongs to NO client, so their invite row has a NULL
-- client_id. Two base-schema assumptions blocked that; both are fixed here.
-- Additive + idempotent. Apply alongside 20260718_owner_tier.sql, AFTER deploy.
--
-- NOT fixed here (base schema, not tracked in this repo — verify in prod):
--   * handle_new_user(): the AFTER-INSERT trigger that creates a profile on
--     first Google sign-in. If it early-returns on a NULL client_id like the
--     old claim_invite() did, a staff member's role won't be set at trigger
--     time — but the hardened claim_invite() below RESCUES them on the very
--     next portal load, so the flow still works end-to-end.
--   * invited_emails INSERT policy: still allows any admin (incl. Staff) to
--     insert invite rows at the DB level. The invite UI is owner-only, but for
--     defense-in-depth consider an owner-only policy for role='admin' invites.

-- 1. invited_emails.client_id was NOT NULL (client invites always name a
--    project). Staff invites have none → allow NULL. Existing client invites
--    are unaffected; the client-scoped RLS insert policy still forbids clients
--    from creating null-client_id rows (their current_user_client_id() is set).
alter table public.invited_emails
  alter column client_id drop not null;

-- 2. claim_invite() treated a NULL client_id as "no invite" and early-returned,
--    so a staff invite would never apply. Recreate it to match by ROW
--    EXISTENCE (not client_id) and set role from the row. Client-invite
--    behaviour is unchanged (they always carry a client_id).
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
  v_found boolean := false;
begin
  select u.email into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is null then
    return false;
  end if;

  -- Row existence, not client_id: a staff invite has a NULL client_id.
  select ie.client_id, ie.role::text, true
    into v_client_id, v_role, v_found
  from public.invited_emails ie
  where ie.email = lower(v_email)
  limit 1;

  if not v_found then
    return false;
  end if;

  -- Only fills a profile that still lacks a client link, so we never overwrite
  -- an existing membership. Staff → client_id stays NULL, role becomes 'admin'.
  update public.profiles
  set client_id = v_client_id,
      role = v_role::public.user_role
  where id = auth.uid()
    and client_id is null;

  delete from public.invited_emails where email = lower(v_email);

  return true;
end;
$$;

grant execute on function public.claim_invite() to authenticated;
