-- Rooted — migration 2
-- Run this once in the Supabase SQL Editor, after supabase/schema.sql.
-- Adds: distinct start/end time on events, and a loggable entry date/time
-- on journal entries (so a study or prayer can be dated to when it
-- actually happened, not just when it was typed in).

alter table calendar_events rename column time to start_time;
alter table calendar_events add column if not exists end_time text not null default '';

alter table journal_entries add column if not exists entry_date date;
alter table journal_entries add column if not exists entry_time text not null default '';

-- Backfill existing entries so older ones still sort/display sensibly.
update journal_entries set entry_date = created_at::date where entry_date is null;

alter table journal_entries alter column entry_date set default current_date;
