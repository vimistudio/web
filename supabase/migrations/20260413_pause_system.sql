-- Pause System
-- Adds rich pause metadata to clients (vs the bare is_active boolean we had)
-- and a SECURITY DEFINER helper for trigger functions to skip notifications
-- when the target client is paused.

alter table public.clients
  add column if not exists paused_reason text,
  add column if not exists paused_note text,
  add column if not exists paused_at timestamptz,
  add column if not exists paused_until timestamptz,
  add column if not exists paused_by uuid references public.profiles(id),
  add column if not exists paused_visible_to_client boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_paused_reason_check'
  ) then
    alter table public.clients
      add constraint clients_paused_reason_check
      check (
        paused_reason is null
        or paused_reason in ('billing', 'client_on_hold', 'scope_paused', 'studio_on_hold', 'other')
      );
  end if;
end $$;

-- Helper used by trigger functions to bail out of notifications when
-- the target client is paused. SECURITY DEFINER + pinned search_path so
-- it runs cleanly inside other SECURITY DEFINER triggers.
create or replace function public.client_is_paused(p_client_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(not is_active, false) from public.clients where id = p_client_id
$$;

grant execute on function public.client_is_paused(uuid) to authenticated;

-- Refuse claim_invite into a paused client (stale invites shouldn't auto-link
-- if the project was paused while the invite sat).
create or replace function public.claim_invite()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_client_id uuid;
  v_role text;
  v_is_active boolean;
begin
  select u.email into v_email from auth.users u where u.id = auth.uid();
  if v_email is null then
    return false;
  end if;

  select ie.client_id, ie.role::text into v_client_id, v_role
  from public.invited_emails ie
  where ie.email = lower(v_email)
  limit 1;

  if v_client_id is null then
    return false;
  end if;

  -- Refuse to link into a paused client. Invite stays in invited_emails so
  -- a future claim (after reactivation) succeeds automatically.
  select c.is_active into v_is_active from public.clients c where c.id = v_client_id;
  if v_is_active is false then
    return false;
  end if;

  update public.profiles
  set client_id = v_client_id, role = v_role::public.user_role
  where id = auth.uid() and client_id is null;

  delete from public.invited_emails where email = lower(v_email);
  return true;
end;
$$;

-- Patch notification triggers to short-circuit on paused clients.
create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor record;
  v_recipient record;
  v_status_label text;
begin
  if old.status = new.status then
    return new;
  end if;

  -- Bail out entirely if the client is paused
  if public.client_is_paused(new.client_id) then
    return new;
  end if;

  v_status_label := case new.status
    when 'queued' then 'Queued'
    when 'in_progress' then 'In Progress'
    when 'review' then 'Review'
    when 'done' then 'Done'
    else new.status::text
  end;

  select p.full_name, p.role into v_actor
  from public.profiles p where p.id = auth.uid();

  if v_actor.role = 'admin' then
    for v_recipient in
      select p.id from public.profiles p
      where p.client_id = new.client_id and p.id != auth.uid()
    loop
      insert into public.notifications (recipient_id, actor_id, type, request_id, title)
      values (
        v_recipient.id, auth.uid(), 'status_changed', new.id,
        new.title || ' moved to ' || v_status_label
      );
    end loop;
  else
    for v_recipient in
      select p.id from public.profiles p
      where p.role = 'admin' and p.id != auth.uid()
    loop
      insert into public.notifications (recipient_id, actor_id, type, request_id, title)
      values (
        v_recipient.id, auth.uid(), 'status_changed', new.id,
        coalesce(v_actor.full_name, 'Client') || ' ' ||
        case when new.status = 'done' then 'approved' else 'requested changes on' end ||
        ' ' || new.title
      );
    end loop;
  end if;

  return new;
end;
$function$;

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request record;
  v_actor record;
  v_recipient record;
begin
  select r.id, r.title, r.client_id into v_request
  from public.requests r where r.id = new.request_id;

  if public.client_is_paused(v_request.client_id) then
    return new;
  end if;

  select p.full_name, p.role into v_actor
  from public.profiles p where p.id = new.author_id;

  if v_actor.role = 'admin' then
    for v_recipient in
      select p.id from public.profiles p
      where p.client_id = v_request.client_id and p.id != new.author_id
    loop
      insert into public.notifications (recipient_id, actor_id, type, request_id, title, body)
      values (
        v_recipient.id, new.author_id, 'comment_added', v_request.id,
        coalesce(v_actor.full_name, 'Your designer') || ' commented on ' || v_request.title,
        left(new.body, 200)
      );
    end loop;
  else
    for v_recipient in
      select p.id from public.profiles p
      where p.role = 'admin' and p.id != new.author_id
    loop
      insert into public.notifications (recipient_id, actor_id, type, request_id, title, body)
      values (
        v_recipient.id, new.author_id, 'comment_added', v_request.id,
        coalesce(v_actor.full_name, 'A client') || ' commented on ' || v_request.title,
        left(new.body, 200)
      );
    end loop;
  end if;

  return new;
end;
$function$;
