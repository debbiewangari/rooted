-- Rooted — migration 9
-- Run this once in the Supabase SQL Editor, after migration-8.sql.
-- Journal entries get the same reusable section-type registry event
-- day-notes already have (migration-4's day_section_types) — built-in
-- types (Notes, Scriptures, Prayer, ...) are always offered, and a user
-- can name a brand new one that's then saved and reusable on any entry.

create table if not exists library_section_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'richtext', -- 'richtext' | 'scripture'
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table library_section_types enable row level security;
create policy "library_section_types_select_own" on library_section_types for select using (auth.uid() = user_id);
create policy "library_section_types_insert_own" on library_section_types for insert with check (auth.uid() = user_id);
create policy "library_section_types_delete_own" on library_section_types for delete using (auth.uid() = user_id);
