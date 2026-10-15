-- Rooted — Supabase schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Every table is scoped to auth.uid() via row-level security, so each
-- signed-in user only ever sees their own rows.

create extension if not exists pgcrypto;

-- Journal / Library entries ---------------------------------------------
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  sections jsonb not null default '[]',
  reference text,
  type text not null default 'reflection',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists journal_entries_user_updated_idx on journal_entries (user_id, updated_at desc);

alter table journal_entries enable row level security;
create policy "journal_entries_select_own" on journal_entries for select using (auth.uid() = user_id);
create policy "journal_entries_insert_own" on journal_entries for insert with check (auth.uid() = user_id);
create policy "journal_entries_update_own" on journal_entries for update using (auth.uid() = user_id);
create policy "journal_entries_delete_own" on journal_entries for delete using (auth.uid() = user_id);

-- Library tags (themes a person tags their entries with) ----------------
create table if not exists library_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table library_tags enable row level security;
create policy "library_tags_select_own" on library_tags for select using (auth.uid() = user_id);
create policy "library_tags_insert_own" on library_tags for insert with check (auth.uid() = user_id);
create policy "library_tags_delete_own" on library_tags for delete using (auth.uid() = user_id);

-- Themes (curated scripture cards, with an optional cover image) --------
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  reference text not null default '',
  image_path text,
  created_at timestamptz not null default now()
);
create index if not exists themes_user_created_idx on themes (user_id, created_at);

alter table themes enable row level security;
create policy "themes_select_own" on themes for select using (auth.uid() = user_id);
create policy "themes_insert_own" on themes for insert with check (auth.uid() = user_id);
create policy "themes_update_own" on themes for update using (auth.uid() = user_id);
create policy "themes_delete_own" on themes for delete using (auth.uid() = user_id);

-- Calendar events / challenges -------------------------------------------
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  category text not null default 'event',
  custom_category text not null default '',
  start_date date not null,
  end_date date not null,
  anchor_verse text not null default '',
  time text not null default '',
  theme text not null default '',
  cover_image_path text,
  created_at timestamptz not null default now()
);
create index if not exists calendar_events_user_start_idx on calendar_events (user_id, start_date);

alter table calendar_events enable row level security;
create policy "calendar_events_select_own" on calendar_events for select using (auth.uid() = user_id);
create policy "calendar_events_insert_own" on calendar_events for insert with check (auth.uid() = user_id);
create policy "calendar_events_update_own" on calendar_events for update using (auth.uid() = user_id);
create policy "calendar_events_delete_own" on calendar_events for delete using (auth.uid() = user_id);

-- Per-day notes within an event/challenge --------------------------------
create table if not exists event_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid not null references calendar_events(id) on delete cascade,
  date date not null,
  focus text not null default '',
  minister text not null default '',
  verses jsonb not null default '[]',
  notes text not null default '',
  prayer_points text not null default '',
  updated_at timestamptz not null default now(),
  unique (event_id, date)
);
create index if not exists event_notes_event_idx on event_notes (event_id);

alter table event_notes enable row level security;
create policy "event_notes_select_own" on event_notes for select using (auth.uid() = user_id);
create policy "event_notes_insert_own" on event_notes for insert with check (auth.uid() = user_id);
create policy "event_notes_update_own" on event_notes for update using (auth.uid() = user_id);
create policy "event_notes_delete_own" on event_notes for delete using (auth.uid() = user_id);

-- Standing prayer lists for an event (not tied to one day) ---------------
create table if not exists prayer_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid not null references calendar_events(id) on delete cascade,
  title text not null,
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists prayer_cards_event_idx on prayer_cards (event_id);

alter table prayer_cards enable row level security;
create policy "prayer_cards_select_own" on prayer_cards for select using (auth.uid() = user_id);
create policy "prayer_cards_insert_own" on prayer_cards for insert with check (auth.uid() = user_id);
create policy "prayer_cards_update_own" on prayer_cards for update using (auth.uid() = user_id);
create policy "prayer_cards_delete_own" on prayer_cards for delete using (auth.uid() = user_id);

-- Verse highlights ---------------------------------------------------------
create table if not exists highlights (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  color text not null,
  reference text not null,
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table highlights enable row level security;
create policy "highlights_select_own" on highlights for select using (auth.uid() = user_id);
create policy "highlights_insert_own" on highlights for insert with check (auth.uid() = user_id);
create policy "highlights_update_own" on highlights for update using (auth.uid() = user_id);
create policy "highlights_delete_own" on highlights for delete using (auth.uid() = user_id);

-- Storage: one bucket for theme/event cover images -------------------------
-- Public read (so <img src> works without signed URLs), writes restricted
-- to the owner's own folder (covers/<user_id>/...).
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers_public_read" on storage.objects for select using (bucket_id = 'covers');
create policy "covers_owner_insert" on storage.objects for insert
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_owner_update" on storage.objects for update
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_owner_delete" on storage.objects for delete
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
