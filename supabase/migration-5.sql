-- Rooted — migration 5
-- Run this once in the Supabase SQL Editor, after migration-4.sql.
-- A small per-user settings row — starts with just the homepage hero
-- image. The file itself reuses the existing `covers` storage bucket
-- (same owner-scoped policies already cover a path under the user's
-- own folder), this table just remembers which path to show.

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hero_image_path text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = user_id);
