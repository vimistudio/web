-- Per-request assignment. Each request can be owned by one admin (assignee_id).
-- Defaults from the client's designer_id at insert time via a BEFORE INSERT
-- trigger, so every creation path (client portal, admin "Add request", future
-- APIs) inherits the right owner without the caller having to set it.
--
-- assignee_id: the admin responsible for THIS request. NULL = unassigned
-- (falls back to the client designer, then all admins, for notifications).
-- Reassignment is a plain column UPDATE from the admin UI.
--
-- DEPLOY ORDER IS FLEXIBLE (before or after the code deploy — both safe):
--   • requests_assignee_id_fkey is the FIRST requests↔profiles relationship, and
--     there are ZERO existing requests↔profiles PostgREST embeds in deployed code
--     (audited), so it cannot recreate the 2026-07-08 embed-ambiguity incident.
--   • The new code never embeds the assignee — it uses `select *` on requests and
--     joins the admin roster in JS. Pre-migration, `assignee_id` simply doesn't
--     exist in the row and the UI degrades to "Unassigned"; post-migration it
--     populates. No un-hinted embed anywhere depends on this constraint.
-- Emergency rollback (behavior reverts instantly; column + data may stay):
--   alter table public.requests drop constraint requests_assignee_id_fkey;
--
-- Written to be re-runnable (idempotent) against a fresh DB and against a
-- partially-applied state.

alter table public.requests
  add column if not exists assignee_id uuid;

alter table public.requests
  drop constraint if exists requests_assignee_id_fkey;

alter table public.requests
  add constraint requests_assignee_id_fkey
  foreign key (assignee_id) references public.profiles(id) on delete set null;

create index if not exists requests_assignee_id_idx
  on public.requests (assignee_id);

comment on column public.requests.assignee_id is
  'Admin profile responsible for this request. Defaults from the client''s designer_id at insert. NULL = unassigned (notifications fall back to client designer, then all admins).';

-- Server-truth default: copy the client's designer onto new requests when the
-- caller didn't set an assignee. SECURITY DEFINER + pinned search_path mirrors
-- the milestone helpers. A default-setter has no client/admin branch to guard
-- (unlike the milestone column guard); it only fills a NULL, so it is safe in
-- every context including service-role / SQL-console inserts.
create or replace function public.requests_default_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is null then
    select c.designer_id
      into new.assignee_id
      from public.clients c
     where c.id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists requests_default_assignee on public.requests;
create trigger requests_default_assignee
  before insert on public.requests
  for each row
  execute function public.requests_default_assignee();

-- Backfill: point existing OPEN requests at their client's designer. Done
-- requests stay NULL (no point routing notifications for closed work). Only
-- fills NULLs, so re-running is a no-op.
update public.requests r
   set assignee_id = c.designer_id
  from public.clients c
 where r.client_id = c.id
   and r.assignee_id is null
   and c.designer_id is not null
   and r.status <> 'done';
