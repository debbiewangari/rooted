-- Rooted — migration 4
-- Run this once in the Supabase SQL Editor, after migration-3.sql.
-- A day's note moves from 5 fixed fields (focus, minister, verses, notes,
-- prayer_points) to a reorderable list of sections — same CMS-style idea
-- as journal_entries.sections, plus a reusable registry of section types
-- (built-ins like "Today's Focus" always available, custom ones a user
-- defines once and can reuse on any day, the same way tags work).

create table if not exists day_section_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'richtext', -- 'text' | 'richtext' | 'scripture'
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table day_section_types enable row level security;
create policy "day_section_types_select_own" on day_section_types for select using (auth.uid() = user_id);
create policy "day_section_types_insert_own" on day_section_types for insert with check (auth.uid() = user_id);
create policy "day_section_types_delete_own" on day_section_types for delete using (auth.uid() = user_id);

alter table event_notes add column if not exists sections jsonb not null default '[]';

-- Fold each day's old fixed fields into sections, in their old display
-- order, only where sections hasn't already been populated.
update event_notes
set sections = (
  (case when coalesce(focus, '') <> '' then
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'typeId', 'focus', 'data', jsonb_build_object('value', focus)))
  else '[]'::jsonb end) ||
  (case when coalesce(minister, '') <> '' then
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'typeId', 'minister', 'data', jsonb_build_object('value', minister)))
  else '[]'::jsonb end) ||
  (case when jsonb_array_length(verses) > 0 then
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'typeId', 'verses', 'data', jsonb_build_object('verses', verses)))
  else '[]'::jsonb end) ||
  (case when coalesce(notes, '') <> '' then
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'typeId', 'notes', 'data', jsonb_build_object('html', notes)))
  else '[]'::jsonb end) ||
  (case when coalesce(prayer_points, '') <> '' then
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'typeId', 'prayer', 'data', jsonb_build_object('html', prayer_points)))
  else '[]'::jsonb end)
)
where sections = '[]'::jsonb;
