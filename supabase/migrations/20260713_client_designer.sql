-- Per-client designer assignment + studio-note freshness stamp.
--
-- designer_id: the admin who owns this client relationship. When set, the
-- client sidebar / mobile studio strip shows THAT person as "tu diseñador",
-- and client-originated notifications route to them instead of fanning out to
-- every admin. NULL = studio default (all admins; generic studio card).
--
-- studio_note_updated_at: when studio_note was last written. Powers the
-- freshness caption ("hoy" / "hace 2 días") and the 14-day staleness guard
-- that hides notes old enough to erode trust ("logos viejos" problem).
--
-- MANUAL APPLY: additive, apply by hand against the database (same posture as
-- 20260712_client_studio_note.sql).

alter table public.clients
  add column if not exists designer_id uuid references public.profiles(id) on delete set null;

comment on column public.clients.designer_id is
  'Admin profile who owns this client relationship. Shown as the client''s designer and receives their notifications. NULL = studio default (all admins).';

alter table public.clients
  add column if not exists studio_note_updated_at timestamptz;

comment on column public.clients.studio_note_updated_at is
  'When studio_note was last written. Powers the freshness caption and 14-day staleness guard. NULL = never stamped (legacy note, treated as stale/hidden).';
