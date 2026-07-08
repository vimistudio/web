-- Fix: the milestone column-guard trigger blocked service-role / SQL-console
-- updates (auth.uid() is null there, so is_admin() returned false and even
-- maintenance updates were rejected). End users always carry a uid; a null
-- uid means server-side context, which legitimately bypasses the guard.
-- Already applied to prod manually on 2026-07-08; kept here for fresh DBs.

create or replace function public.client_milestones_guard_client_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then
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
