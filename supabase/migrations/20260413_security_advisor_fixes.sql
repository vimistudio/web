-- Security advisor fixes
-- 1. Pin search_path on SECURITY DEFINER trigger functions (lint 0011)
-- 2. Drop redundant WITH CHECK (true) INSERT policies — all writes go through
--    SECURITY DEFINER trigger functions owned by postgres, which bypass RLS (lint 0024)

alter function public.notify_on_comment()        set search_path = '';
alter function public.notify_on_status_change()  set search_path = '';
alter function public.log_status_change()        set search_path = '';
alter function public.log_comment_added()        set search_path = '';
alter function public.log_deliverable_upload()   set search_path = '';

drop policy if exists "System can insert activity" on public.activity_log;
drop policy if exists "Authenticated users can receive notifications" on public.notifications;
