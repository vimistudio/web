-- Per-client accent color for the Vimi Client Journey design language.
--
-- Each client's portal takes on their brand accent (buttons, dots, progress,
-- avatars) via the CSS variable --accent, injected on the portal shell from
-- this column. NULL means "use the Vimi violet studio default" (#5B4BD6).
--
-- MANUAL APPLY: this migration is additive and must be applied by hand against
-- the database (same posture as 20260707_client_team_invites.sql). The portal
-- and admin code tolerate the column being absent — a missing column simply
-- reads as undefined and falls back to the default accent.

alter table public.clients
  add column if not exists accent_color text;

comment on column public.clients.accent_color is
  'Hex accent color (e.g. #5B4BD6) for this client''s portal. NULL = Vimi default.';
