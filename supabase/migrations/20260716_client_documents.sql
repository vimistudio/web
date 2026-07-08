-- Agreement hub: per-client documents + engagement start date.
--
-- Powers the "Nuestro acuerdo" client hub (/portal/agreement): the deal card,
-- the 30-day month chip, and the documents grid (Propuesta / Plan / Manual).
--
-- Uses the existing SECURITY DEFINER helpers is_admin() and
-- current_user_client_id() (see 20260413_fix_profiles_rls_leak.sql), which are
-- search_path-pinned to avoid recursive RLS evaluation. Same RLS shape as
-- 20260709_client_milestones.sql.
--
-- MANUAL APPLY: this migration is additive and idempotent (safe to re-run). It
-- adds no relationship between profiles and clients, so it can be applied before
-- OR after the code deploy — nothing already deployed reads these columns; the
-- new agreement page enumerates them and renders an empty state until rows exist.
--
-- DASHBOARD STEP (do this first): the storage policies below assume a private
-- bucket named "client-docs" already exists. Create it by hand:
--   Storage → New bucket → name "client-docs" → Public: OFF →
--   file size limit: 50MB.
-- Object paths are "{client_id}/{doc_id}/{file_name}"; the first path segment
-- (client_id) powers the client-read storage SELECT policy.

alter table public.clients
  add column if not exists engagement_started_at date;
comment on column public.clients.engagement_started_at is
  'Day 1 of the retainer engagement. Drives the hub month chip + 30-day progress. NULL = hide month UI.';

create table if not exists public.client_documents (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  kind         text not null default 'other'
                 check (kind in ('proposal','plan','manual','contract','other')),
  title        text not null,
  description  text,                -- client-facing meta line ("PDF · 21 páginas · mayo 2026")
  status_label text,                -- free client-facing chip ("FIRMADO" / "EN CURSO" / "DÍA 30"); shown verbatim, never localized
  file_path    text,                -- storage path in client-docs; NULL = placeholder "en preparación"
  file_name    text,
  file_size    bigint,
  mime_type    text,
  sort         int not null default 0,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists client_documents_client_id_idx
  on public.client_documents (client_id);

alter table public.client_documents enable row level security;

drop policy if exists "Admins manage client documents" on public.client_documents;
create policy "Admins manage client documents"
  on public.client_documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Clients view own documents" on public.client_documents;
create policy "Clients view own documents"
  on public.client_documents for select to authenticated
  using (client_id = public.current_user_client_id());

-- Storage policies (bucket "client-docs" created manually; first path segment = client_id).
-- The client SELECT policy is what makes server-side createSignedUrl work for clients.
drop policy if exists "Admins manage client-docs objects" on storage.objects;
create policy "Admins manage client-docs objects"
  on storage.objects for all to authenticated
  using (bucket_id = 'client-docs' and public.is_admin())
  with check (bucket_id = 'client-docs' and public.is_admin());

drop policy if exists "Clients read own client-docs objects" on storage.objects;
create policy "Clients read own client-docs objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'client-docs'
    and (storage.foldername(name))[1] = public.current_user_client_id()::text
  );
