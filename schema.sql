-- Bondly: run this entire file in Supabase → SQL Editor → New query → Run.
-- It creates the shared database, safe access rules, and file-storage buckets.

create extension if not exists pgcrypto;

create table if not exists student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  university text not null,
  course text,
  study_year text,
  interests text[] default '{}',
  bio text default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists connections (
  requester_id uuid not null references student_profiles(id) on delete cascade,
  recipient_id uuid not null references student_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  primary key (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references student_profiles(id) on delete cascade,
  kind text not null default 'weekly_highlight' check (kind in ('weekly_highlight','internship')),
  caption text default '',
  hashtags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  image_url text not null,
  position smallint not null check (position between 1 and 7)
);

create table if not exists opportunities (
  post_id uuid primary key references posts(id) on delete cascade,
  title text not null,
  company text,
  location text,
  application_url text
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references student_profiles(id) on delete cascade,
  subject text not null,
  topic text not null,
  study_year text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  name text,
  is_group boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists chat_members (
  chat_id uuid not null references chats(id) on delete cascade,
  profile_id uuid not null references student_profiles(id) on delete cascade,
  primary key (chat_id, profile_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_id uuid not null references student_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_university_idx on student_profiles(university);
create index if not exists posts_created_idx on posts(created_at desc);
create index if not exists notes_search_idx on notes(subject, topic, study_year);

alter table student_profiles enable row level security;
alter table connections enable row level security;
alter table posts enable row level security;
alter table post_images enable row level security;
alter table opportunities enable row level security;
alter table notes enable row level security;
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;

create policy "signed-in students can view profiles" on student_profiles for select to authenticated using (true);
create policy "students create own profile" on student_profiles for insert to authenticated with check (id = auth.uid());
create policy "students update own profile" on student_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "students view their connection requests" on connections for select to authenticated using (requester_id = auth.uid() or recipient_id = auth.uid());
create policy "students send their own requests" on connections for insert to authenticated with check (requester_id = auth.uid());
create policy "students update received requests" on connections for update to authenticated using (recipient_id = auth.uid());
create policy "signed-in students view posts" on posts for select to authenticated using (true);
create policy "students create own posts" on posts for insert to authenticated with check (author_id = auth.uid());
create policy "students edit own posts" on posts for update to authenticated using (author_id = auth.uid());
create policy "students delete own posts" on posts for delete to authenticated using (author_id = auth.uid());
create policy "signed-in students view post images" on post_images for select to authenticated using (true);
create policy "post owners add images" on post_images for insert to authenticated with check (exists(select 1 from posts where id = post_id and author_id = auth.uid()));
create policy "signed-in students view opportunities" on opportunities for select to authenticated using (true);
create policy "post owners create opportunities" on opportunities for insert to authenticated with check (exists(select 1 from posts where id = post_id and author_id = auth.uid()));
create policy "signed-in students view notes" on notes for select to authenticated using (true);
create policy "students upload own notes" on notes for insert to authenticated with check (uploader_id = auth.uid());
create policy "members view chats" on chats for select to authenticated using (exists(select 1 from chat_members where chat_id = id and profile_id = auth.uid()));
create policy "students create chats" on chats for insert to authenticated with check (true);
create policy "members view chat members" on chat_members for select to authenticated using (exists(select 1 from chat_members cm where cm.chat_id = chat_members.chat_id and cm.profile_id = auth.uid()));
create policy "students add chat members" on chat_members for insert to authenticated with check (true);
create policy "members view messages" on messages for select to authenticated using (exists(select 1 from chat_members where chat_id = messages.chat_id and profile_id = auth.uid()));
create policy "members send messages" on messages for insert to authenticated with check (sender_id = auth.uid() and exists(select 1 from chat_members where chat_id = messages.chat_id and profile_id = auth.uid()));

alter publication supabase_realtime add table messages;

insert into storage.buckets (id, name, public) values ('highlight-images','highlight-images',true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('note-files','note-files',true) on conflict (id) do nothing;
create policy "authenticated upload highlight images" on storage.objects for insert to authenticated with check (bucket_id = 'highlight-images');
create policy "anyone signed in views highlight images" on storage.objects for select to authenticated using (bucket_id = 'highlight-images');
create policy "authenticated upload note files" on storage.objects for insert to authenticated with check (bucket_id = 'note-files');
create policy "anyone signed in views note files" on storage.objects for select to authenticated using (bucket_id = 'note-files');
