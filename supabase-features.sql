-- Run once in Supabase SQL Editor after schema.sql.
-- Adds notifications and the extra details needed for internship posts.

alter table public.opportunities add column if not exists field text;
alter table public.opportunities add column if not exists description text;
alter table public.opportunities add column if not exists deadline date;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.student_profiles(id) on delete cascade,
  sender_id uuid references public.student_profiles(id) on delete cascade,
  type text not null check (type in ('connection_request', 'internship')),
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "students view own notifications" on public.notifications
for select to authenticated using (recipient_id = auth.uid());

create policy "students create notifications" on public.notifications
for insert to authenticated with check (sender_id = auth.uid());

create policy "students update own notifications" on public.notifications
for update to authenticated using (recipient_id = auth.uid());

alter publication supabase_realtime add table public.notifications;
