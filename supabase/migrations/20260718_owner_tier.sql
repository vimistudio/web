-- Owner / Staff permission tier (pre-hire wave-2 core).
--
-- Design: every studio member keeps role='admin' in the DB, so every existing
-- is_admin() RLS check keeps working untouched. Ownership is a separate flag:
--   Owner = role='admin' AND is_owner = true   (Carlos: full access, incl.
--           revenue + people management)
--   Staff = role='admin' AND is_owner = false  (photographer: operational
--           access, no revenue, no Settings, no ability to demote/reassign)
--
-- DEPLOY ORDER: apply this AFTER the code that reads is_owner is deployed. The
-- app code tolerates the column being absent (select * → is_owner undefined).
--
-- FAIL-OPEN OWNERSHIP (read this before touching the app gate):
--   Pre-migration, `select *` returns rows WITHOUT is_owner, so profile.is_owner
--   is `undefined`. If the app treated undefined as "not owner", the ONLY human
--   (Carlos) would be locked out of Settings/revenue during the deploy window —
--   a solo-owner lockout. To avoid that, the app derives ownership as:
--       isOwner = profile.is_owner !== false
--   i.e. ONLY an explicit `false` demotes to staff. undefined (column absent)
--   and true both read as owner. Once this migration lands, every existing
--   admin gets is_owner=false by default (staff) EXCEPT the seeded owner below.
--
-- This migration is additive and idempotent (safe to re-run).

-- 1. The flag.
alter table public.profiles
  add column if not exists is_owner boolean not null default false;

-- 2. is_owner() helper — mirrors is_admin() (SECURITY DEFINER, search_path
--    pinned to avoid recursive RLS evaluation on the self-referencing subquery).
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_owner
  )
$$;

-- 3. DB-level owner protection: only an Owner may update ANY other profile row
--    (demote, reassign client, flip is_owner). This replaces the old
--    "Admins can update any profile" policy from 20260413_admins_can_update_profiles.sql
--    so a Staff member can no longer demote/reassign anyone.
--
--    NOTE: self-updates (own profile locale, etc.) rely on a SEPARATE own-row
--    UPDATE policy that lives in the base schema (pre-migration-tracking). That
--    policy is confirmed present in production because non-admin clients can
--    change their own locale today (see profile-view.tsx). It is untouched here,
--    so Staff can still edit their own row.
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Owners can update any profile" on public.profiles;
create policy "Owners can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- 4. Seed the sole owner.
update public.profiles
set is_owner = true
where lower(email) = 'carlos@vimistudio.com';
