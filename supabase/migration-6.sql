-- Rooted — migration 6
-- Run this once in the Supabase SQL Editor, after migration-5.sql.
-- Lets prayer lists be drag-reordered — a plain integer position, written
-- whenever a list is dropped in a new spot. New/unreordered rows are left
-- null and simply sort after any row that already has a position.

alter table prayer_cards add column if not exists position integer;
