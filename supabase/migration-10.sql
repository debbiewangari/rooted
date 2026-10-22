-- Rooted — migration 10
-- Run this once in the Supabase SQL Editor, after migration-9.sql.
-- Introduces a proper study hierarchy: Study series -> Chapters -> Sections
-- -> Content blocks. A chapter is just a journal_entries row (type 'study')
-- that belongs to a series, reusing all the existing section/linking/editor
-- machinery rather than inventing a parallel content model.

create table if not exists study_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  theme text not null default '',
  anchor_reference text not null default '',
  cover_image_path text,
  last_opened_chapter_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists study_series_user_created_idx on study_series (user_id, created_at);

alter table study_series enable row level security;
create policy "study_series_select_own" on study_series for select using (auth.uid() = user_id);
create policy "study_series_insert_own" on study_series for insert with check (auth.uid() = user_id);
create policy "study_series_update_own" on study_series for update using (auth.uid() = user_id);
create policy "study_series_delete_own" on study_series for delete using (auth.uid() = user_id);

-- A chapter is a journal_entries row with series_id set — chapter_order
-- positions it within the series' table of contents, subtitle/intro give it
-- the extra editorial fields a flat journal entry doesn't need.
alter table journal_entries add column if not exists series_id uuid references study_series(id) on delete cascade;
alter table journal_entries add column if not exists chapter_order integer;
alter table journal_entries add column if not exists subtitle text not null default '';
alter table journal_entries add column if not exists intro_html text not null default '';
create index if not exists journal_entries_series_order_idx on journal_entries (series_id, chapter_order);

-- entry_links can now also point at a study series (e.g. linking an existing
-- Journal entry to a series as supporting material), alongside the three
-- kinds migration-8 already allowed.
alter table entry_links drop constraint if exists entry_links_a_type_check;
alter table entry_links drop constraint if exists entry_links_b_type_check;

alter table entry_links
  add constraint entry_links_a_type_check check (a_type in ('entry', 'day_note', 'prayer_card', 'study_series'));
alter table entry_links
  add constraint entry_links_b_type_check check (b_type in ('entry', 'day_note', 'prayer_card', 'study_series'));
