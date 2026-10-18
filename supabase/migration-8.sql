-- Rooted — migration 8
-- Run this once in the Supabase SQL Editor, after migration-7.sql.
-- Lets a prayer list (prayer_cards) be a third kind of thing entry_links
-- can point at, alongside journal entries and event day-notes — the
-- CHECK constraint from migration-7 only allowed 'entry'/'day_note'.

alter table entry_links drop constraint if exists entry_links_a_type_check;
alter table entry_links drop constraint if exists entry_links_b_type_check;

alter table entry_links
  add constraint entry_links_a_type_check check (a_type in ('entry', 'day_note', 'prayer_card'));
alter table entry_links
  add constraint entry_links_b_type_check check (b_type in ('entry', 'day_note', 'prayer_card'));
