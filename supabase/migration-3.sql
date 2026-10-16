-- Rooted — migration 3
-- Run this once in the Supabase SQL Editor, after migration-2.sql.
-- Prayer lists move from a structured "add one point at a time" items
-- array to a single free-form rich-text note (same editor as Notes /
-- Prayer Points), so existing items are folded into a bulleted list.

alter table prayer_cards add column if not exists notes text not null default '';

update prayer_cards
set notes = coalesce(
  (
    select '<ul>' || string_agg('<li>' || (item ->> 'text') || '</li>', '') || '</ul>'
    from jsonb_array_elements(items) as item
    where (item ->> 'text') is not null and (item ->> 'text') <> ''
  ),
  ''
)
where notes = '' and jsonb_array_length(items) > 0;
