-- Rooted — migration 7
-- Run this once in the Supabase SQL Editor, after migration-6.sql.
-- Lets a journal entry or an event day's notes be linked to each other —
-- a lightweight, symmetric connection separate from themes/tags. A link
-- can point at either a journal entry or an event_notes row, so this
-- stores the kind alongside each id instead of a normal foreign key
-- (which can only ever point at one table).

create table if not exists entry_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  a_type text not null check (a_type in ('entry', 'day_note')),
  a_id uuid not null,
  b_type text not null check (b_type in ('entry', 'day_note')),
  b_id uuid not null,
  created_at timestamptz not null default now(),
  unique (a_type, a_id, b_type, b_id)
);

create index if not exists entry_links_a_idx on entry_links (a_type, a_id);
create index if not exists entry_links_b_idx on entry_links (b_type, b_id);

alter table entry_links enable row level security;
create policy "entry_links_select_own" on entry_links for select using (auth.uid() = user_id);
create policy "entry_links_insert_own" on entry_links for insert with check (auth.uid() = user_id);
create policy "entry_links_delete_own" on entry_links for delete using (auth.uid() = user_id);
