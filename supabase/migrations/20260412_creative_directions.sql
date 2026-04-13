-- Creative Directions Voting
-- Adds direction metadata to deliverables and voting mode to requests
--
-- IDEMPOTENT: Safe to run multiple times (all statements use IF NOT EXISTS / IF EXISTS)
-- ROLLBACK:   See 20260412_creative_directions_rollback.sql

-- 1. Add direction columns to deliverables
alter table public.deliverables
  add column if not exists direction_label text,
  add column if not exists direction_description text,
  add column if not exists direction_order integer,
  add column if not exists is_recommended boolean not null default false;

-- 2. Add voting_mode to requests (null = standard review, 'single' = one voter, 'team' = multi-voter)
alter table public.requests
  add column if not exists voting_mode text;

-- 3. Add comment column to deliverable_events for vote comments
alter table public.deliverable_events
  add column if not exists comment text;

-- 4. Index for efficient direction queries
create index if not exists idx_deliverables_direction_order
  on public.deliverables (request_id, direction_order)
  where direction_order is not null;

-- 5. Index for efficient vote lookups
create index if not exists idx_deliverable_events_votes
  on public.deliverable_events (deliverable_id, event_type)
  where event_type in ('vote', 'direction_vote');
