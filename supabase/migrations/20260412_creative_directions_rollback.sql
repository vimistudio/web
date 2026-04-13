-- ROLLBACK: Creative Directions Voting
-- Reverts 20260412_creative_directions.sql
--
-- IDEMPOTENT: Safe to run multiple times (all statements use IF EXISTS)
-- WARNING: This drops direction data. Back up deliverable_events with
--          event_type = 'direction_vote' if you need an audit trail.

-- 1. Drop indexes first
drop index if exists public.idx_deliverable_events_votes;
drop index if exists public.idx_deliverables_direction_order;

-- 2. Remove direction vote events (preserve view/download events)
delete from public.deliverable_events
  where event_type in ('direction_vote', 'direction_view');

-- 3. Remove columns from deliverable_events
alter table public.deliverable_events
  drop column if exists comment;

-- 4. Remove columns from requests
alter table public.requests
  drop column if exists voting_mode;

-- 5. Remove columns from deliverables (order matters: drop data columns last)
alter table public.deliverables
  drop column if exists is_recommended,
  drop column if exists direction_order,
  drop column if exists direction_description,
  drop column if exists direction_label;
