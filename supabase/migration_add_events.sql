-- Migration: Calendar of assignment due dates, exams and other course events
-- Run this in the Supabase SQL Editor.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  course_code text,
  event_type text not null default 'other'
    check (event_type in ('assignment', 'exam', 'quiz', 'submission', 'presentation', 'class', 'other')),
  event_date date not null,
  event_time time,
  location text,
  created_by uuid not null,
  created_by_name text,
  created_by_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_course on public.events(course_code);

alter table public.events enable row level security;

-- Public: read approved events only
create policy "Anyone can read approved events"
  on public.events for select
  using (status = 'approved');

-- Authenticated users: read own events (any status)
create policy "Users can read own events"
  on public.events for select
  using (auth.uid() = created_by);

-- Moderators: read all events
create policy "Moderators can read all events"
  on public.events for select
  using (
    exists (
      select 1 from public.moderators
      where user_email = auth.jwt() ->> 'email'
    )
  );

-- Authenticated users: submit events for review
create policy "Authenticated users can add events"
  on public.events for insert
  with check (
    auth.uid() = created_by
    and status = 'pending'
  );

-- Moderators: approve / reject / edit
create policy "Moderators can update events"
  on public.events for update
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

-- Moderators: delete
create policy "Moderators can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.moderators
      where user_email = auth.jwt() ->> 'email'
    )
  );
