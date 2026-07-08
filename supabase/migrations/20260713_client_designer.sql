-- Per-client designer assignment + studio-note freshness stamp.
--
-- designer_id: the admin who owns this client relationship. When set, the
-- client sidebar / mobile studio strip shows THAT person, and client-originated
-- notifications route to them instead of fanning out to every admin.
-- NULL = studio default (all admins; generic studio card).
--
-- studio_note_updated_at: when studio_note was last written. Powers the
-- freshness caption ("hoy" / "hace 2 días") and the 14-day staleness guard
-- that hides notes old enough to erode trust ("logos viejos" problem).
--
-- ⚠️⚠️ APPLY ONLY AFTER THIS PR'S CODE IS DEPLOYED. ⚠️⚠️
-- The FK constraint below creates a SECOND relationship between profiles and
-- clients, which makes every un-hinted PostgREST embed between those tables
-- ambiguous — it broke prod on 2026-07-08 when applied ahead of code (Team &
-- Roles emptied, invite emails failed). This PR adds explicit
-- `clients!profiles_client_id_fkey` hints to every such embed; the constraint
-- and the hinted code MUST land together. Emergency rollback:
-- `alter table public.clients drop constraint clients_designer_id_fkey;`
-- restores PostgREST behavior instantly (column + data can stay).
--
-- Written to be re-runnable against the incident state (column present,
-- constraint dropped) as well as a fresh database.

alter table public.clients
  add column if not exists designer_id uuid;

alter table public.clients
  drop constraint if exists clients_designer_id_fkey;

alter table public.clients
  add constraint clients_designer_id_fkey
  foreign key (designer_id) references public.profiles(id) on delete set null;

comment on column public.clients.designer_id is
  'Admin profile who owns this client relationship. Shown as the client''s designer and receives their notifications. NULL = studio default (all admins).';

alter table public.clients
  add column if not exists studio_note_updated_at timestamptz;

comment on column public.clients.studio_note_updated_at is
  'When studio_note was last written. Powers the freshness caption and 14-day staleness guard. NULL = never stamped (legacy note, treated as stale/hidden).';
