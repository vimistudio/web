-- Per-client studio note: a short, admin-authored line shown in the client
-- sidebar's studio card (e.g. "La auditoría va en marcha — sneak peek el
-- jueves"). Authored per client in their own language and shown verbatim — the
-- honest version of the prototype's designer note (no fake presence). NULL
-- hides the note entirely.
--
-- MANUAL APPLY: this migration is additive and must be applied by hand against
-- the database (same posture as 20260711_client_deal_terms.sql).

alter table public.clients
  add column if not exists studio_note text;

comment on column public.clients.studio_note is
  'Short admin-authored note shown in the client sidebar studio card, e.g. "La auditoría va en marcha — sneak peek el jueves". NULL = hidden.';
