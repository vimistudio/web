-- Client plan milestones: the "client plan tracker" hand-holding surface for
-- retainer clients. A month plan runs across parallel tracks (e.g. Vía A
-- "La web" and Vía B "El sistema") with weekly milestones (week 5 = final
-- delivery) plus a "lo que necesitamos de ti" list the client ticks off.
--
-- Uses the existing SECURITY DEFINER helpers is_admin() and
-- current_user_client_id() (see 20260413_fix_profiles_rls_leak.sql), which are
-- search_path-pinned to avoid recursive RLS evaluation.
--
-- MANUAL APPLY: this migration is additive and must be applied by hand against
-- the database (same posture as 20260707_client_team_invites.sql and
-- 20260708_client_accent_color.sql). The portal renders nothing when a client
-- has zero milestones, so the feature is invisible until rows exist.

create table if not exists public.client_milestones (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  track         text not null,
  week          int  not null check (week between 1 and 5),
  title         text not null,
  description   text,
  status        text not null default 'upcoming'
                  check (status in ('upcoming', 'current', 'done')),
  needs_client  boolean not null default false,
  client_done   boolean not null default false,
  request_id    uuid references public.requests(id) on delete set null,
  sort          int  not null default 0,
  created_at    timestamptz default now()
);

create index if not exists client_milestones_client_id_idx
  on public.client_milestones (client_id);

alter table public.client_milestones enable row level security;

-- Admins manage everything.
drop policy if exists "Admins manage all milestones" on public.client_milestones;
create policy "Admins manage all milestones"
  on public.client_milestones
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Clients can read their own client's milestones.
drop policy if exists "Clients view own milestones" on public.client_milestones;
create policy "Clients view own milestones"
  on public.client_milestones
  for select
  to authenticated
  using (client_id = public.current_user_client_id());

-- Clients can update their own client's milestone rows. The RLS policy scopes
-- WHICH rows; the trigger below scopes WHICH columns (client_done only), so a
-- client can tick "done" but cannot rewrite the plan.
drop policy if exists "Clients update own milestones" on public.client_milestones;
create policy "Clients update own milestones"
  on public.client_milestones
  for update
  to authenticated
  using (client_id = public.current_user_client_id())
  with check (client_id = public.current_user_client_id());

-- Column-level guard: non-admins may only change client_done. Any attempt to
-- edit another column via the client UPDATE policy is rejected.
create or replace function public.client_milestones_guard_client_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.id           is distinct from old.id
     or new.client_id    is distinct from old.client_id
     or new.track        is distinct from old.track
     or new.week         is distinct from old.week
     or new.title        is distinct from old.title
     or new.description  is distinct from old.description
     or new.status       is distinct from old.status
     or new.needs_client is distinct from old.needs_client
     or new.request_id   is distinct from old.request_id
     or new.sort         is distinct from old.sort
     or new.created_at   is distinct from old.created_at
  then
    raise exception 'Clients may only update the client_done column on milestones';
  end if;
  return new;
end;
$$;

drop trigger if exists client_milestones_guard_client_update
  on public.client_milestones;
create trigger client_milestones_guard_client_update
  before update on public.client_milestones
  for each row
  execute function public.client_milestones_guard_client_update();
