-- Extend Creative Directions voting to social_posts
-- Adds tags + direction metadata + is_hidden to social_posts
-- Allows deliverable_events to vote on either a deliverable OR a social_post

alter table public.social_posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists direction_label text,
  add column if not exists direction_description text,
  add column if not exists direction_order integer,
  add column if not exists is_recommended boolean not null default false,
  add column if not exists is_hidden boolean not null default false;

alter table public.deliverable_events
  alter column deliverable_id drop not null,
  add column if not exists social_post_id uuid references public.social_posts(id) on delete cascade;

-- Exactly one of deliverable_id / social_post_id must be set
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deliverable_events_target_check'
  ) then
    alter table public.deliverable_events
      add constraint deliverable_events_target_check
      check (
        (deliverable_id is not null and social_post_id is null)
        or (deliverable_id is null and social_post_id is not null)
      );
  end if;
end $$;

create index if not exists idx_deliverable_events_social_post
  on public.deliverable_events (social_post_id, event_type)
  where social_post_id is not null;

create index if not exists idx_social_posts_direction_order
  on public.social_posts (request_id, direction_order)
  where direction_order is not null;
