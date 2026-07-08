-- Delayed milestones with a transparent reason.
--
-- Honesty-as-feature (per the client proposal: "si algo se mueve, lo decimos el
-- mismo día"). A milestone can be marked 'delayed' with a required delay_note
-- shown to the client. A delayed milestone still counts as NOT done for the
-- week/progress computation.
--
-- MANUAL APPLY: additive and idempotent. Safe to run on a fresh DB (right after
-- 20260709_client_milestones.sql) and on a DB where 20260709 already ran — the
-- status check constraint is dropped-if-exists then re-added with the full set,
-- and delay_note is added-if-not-exists.

alter table public.client_milestones
  drop constraint if exists client_milestones_status_check;

alter table public.client_milestones
  add constraint client_milestones_status_check
  check (status in ('upcoming', 'current', 'done', 'delayed'));

alter table public.client_milestones
  add column if not exists delay_note text;

comment on column public.client_milestones.delay_note is
  'Client-facing reason shown when status = ''delayed''. Required in the admin editor.';
