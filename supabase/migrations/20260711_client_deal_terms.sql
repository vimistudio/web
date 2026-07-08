-- Per-client deal terms: a short, client-facing contract line shown in the
-- plan header (e.g. "Sin permanencia · cancelan con 30 días"). These are
-- authored per client in their own language and shown verbatim — they are NOT
-- a studio-wide policy, so we must never hardcode one client's terms for all.
--
-- MANUAL APPLY: this migration is additive and must be applied by hand against
-- the database (same posture as 20260709_client_milestones.sql). NULL means the
-- plan header shows only the amount.

alter table public.clients
  add column if not exists deal_terms text;

comment on column public.clients.deal_terms is
  'Short client-facing contract line shown in the plan header, e.g. "Sin permanencia · cancelan con 30 días". NULL = show only the amount.';
