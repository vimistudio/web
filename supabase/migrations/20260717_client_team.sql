-- Per-client studio TEAM (multi-person crew).
--
-- Un-parks the client_team model: a client is now served by a small crew of
-- studio people (designer, PM, photographer…), not a single designer. Exactly
-- one member is the LEAD ("contacto principal") — they sign the portal note and
-- are the routing target.
--
-- ⚠️ designer_id STAYS the routing source of truth. This table is additive: the
-- Edit Client editor writes clients.designer_id = the lead's profile_id on every
-- save, so notification routing / studio-card code that reads designer_id keeps
-- working untouched. client_team is the richer, client-visible crew list layered
-- on top. Never drop designer_id in favour of this table without migrating those
-- readers first.
--
-- FK-safety: both FKs here originate from a NEW join table (client_team →
-- clients, client_team → profiles). Unlike clients.designer_id (which added a
-- SECOND direct clients↔profiles relationship and broke every un-hinted embed —
-- see 20260713_client_designer.sql and the 2026-07-08 incident), a join table
-- introduces no ambiguity for existing clients/profiles embeds. Do NOT embed
-- across client_team in the old clients/profiles queries; new code fetches
-- client_team rows and JS-joins profiles (or uses explicit
-- client_team!client_team_profile_id_fkey hints).
--
-- Additive + idempotent: safe to re-run. Manual-apply AFTER this PR's code ships.

-- Studio-facing default role for an admin (e.g. 'Fotógrafa'). New client_team
-- memberships default their role_label from this. Editable elsewhere (follow-up).
alter table public.profiles
  add column if not exists title text;

comment on column public.profiles.title is
  'Studio-facing default role for an admin (e.g. Designer, PM, Fotógrafa). Used to pre-fill client_team.role_label. NULL = no default.';

create table if not exists public.client_team (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  -- Free admin text, shown to the client verbatim (deal_terms doctrine: the
  -- studio owns the wording, no enum). NULL falls back to the person's title.
  role_label text,
  is_lead boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, profile_id)
);

comment on table public.client_team is
  'Studio crew serving a client. Exactly one row per client has is_lead=true (the contacto principal); clients.designer_id is kept in sync with that lead by the Edit Client editor.';

create index if not exists client_team_client_id_idx
  on public.client_team (client_id);

alter table public.client_team enable row level security;

-- Admins manage the whole table.
drop policy if exists "Admins manage client team" on public.client_team;
create policy "Admins manage client team"
  on public.client_team
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Clients can read their own crew — the portal preview promises "las personas
-- en tu proyecto", so the client must be able to see them.
drop policy if exists "Clients view own client team" on public.client_team;
create policy "Clients view own client team"
  on public.client_team
  for select
  to authenticated
  using (client_id = public.current_user_client_id());

-- Backfill: seed a lead row per client from the existing single designer_id.
-- Idempotent via the unique(client_id, profile_id) constraint.
insert into public.client_team (client_id, profile_id, role_label, is_lead)
select c.id, c.designer_id, 'Designer', true
from public.clients c
where c.designer_id is not null
on conflict (client_id, profile_id) do nothing;
