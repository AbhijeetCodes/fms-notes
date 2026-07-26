-- ============================================================
-- FMS Class Notes Library — Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project.
-- ============================================================

-- 1. Tables
create table public.courses (
  code text primary key,
  name text not null,
  semester int,
  kind text not null check (kind in ('core', 'elective')),
  area text
);

create table public.moderators (
  user_email text primary key
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  course_code text not null references public.courses(code),
  title text not null,
  description text,
  url text,
  file_path text,
  file_name text,
  file_size bigint,
  file_type text,
  tags text[] default '{}',
  uploader_id uuid not null,
  uploader_name text,
  uploader_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_documents_course on public.documents(course_code);
create index idx_documents_status on public.documents(status);
create index idx_documents_uploader on public.documents(uploader_id);

-- 2. Enable RLS
alter table public.courses enable row level security;
alter table public.documents enable row level security;
alter table public.moderators enable row level security;

-- 3. RLS policies — courses (public read)
create policy "Anyone can read courses"
  on public.courses for select
  using (true);

-- 4. RLS policies — moderators (only moderators can read their own row)
create policy "Moderators can read moderators table"
  on public.moderators for select
  using (auth.jwt() ->> 'email' = user_email);

-- 5. RLS policies — documents
-- Public: read approved documents only
create policy "Anyone can read approved documents"
  on public.documents for select
  using (status = 'approved');

-- Authenticated users: read own documents (any status)
create policy "Users can read own documents"
  on public.documents for select
  using (auth.uid() = uploader_id);

-- Moderators: read all documents
create policy "Moderators can read all documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.moderators
      where user_email = auth.jwt() ->> 'email'
    )
  );

-- Authenticated users: insert with pending status only
create policy "Authenticated users can upload"
  on public.documents for insert
  with check (
    auth.uid() = uploader_id
    and status = 'pending'
  );

-- Moderators: update status fields
create policy "Moderators can update document status"
  on public.documents for update
  using (
    exists (
      select 1 from public.moderators
      where user_email = auth.jwt() ->> 'email'
    )
  )
  with check (
    exists (
      select 1 from public.moderators
      where user_email = auth.jwt() ->> 'email'
    )
  );

-- 6. Storage bucket policies
-- Run these AFTER creating a bucket named "documents" in the Supabase dashboard
-- (Settings: public bucket = OFF, file size limit = 15MB,
--  allowed MIME types: application/pdf, application/vnd.ms-powerpoint,
--  application/vnd.openxmlformats-officedocument.presentationml.presentation,
--  application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--  application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );

-- Public can download files only if matching document row is approved
create policy "Public can download approved files"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      exists (
        select 1 from public.documents
        where documents.file_path = objects.name
        and documents.status = 'approved'
      )
      or exists (
        select 1 from public.moderators
        where user_email = auth.jwt() ->> 'email'
      )
    )
  );
