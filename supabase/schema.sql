-- Run this once in the Supabase project's SQL Editor (Database → SQL Editor
-- → New query) before the app can read/write anything. Safe to re-run — each
-- statement is idempotent. If you already ran an earlier version of this
-- file, just running the whole thing again picks up anything new (like
-- jarvis_state below) without disturbing existing tables/data.

create table if not exists quarantine_items (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists codex_entries (
  id text primary key,
  category text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists overview_data (
  id text primary key,
  data jsonb not null
);

-- Jarvis's chat history + "Steer Jarvis" standing instructions, so a
-- conversation continues across devices instead of each browser having its
-- own separate copy.
create table if not exists jarvis_state (
  id text primary key,
  data jsonb not null
);

alter table quarantine_items enable row level security;
alter table codex_entries enable row level security;
alter table overview_data enable row level security;
alter table jarvis_state enable row level security;

-- There's only ever one DM account for this app, so policies just check
-- "is there a valid logged-in session" rather than matching a specific user
-- id. Real protection comes from requiring auth.role() = 'authenticated' at
-- all — an anonymous request (anon key with no session) is refused outright.
drop policy if exists "authenticated full access" on quarantine_items;
create policy "authenticated full access" on quarantine_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on codex_entries;
create policy "authenticated full access" on codex_entries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on overview_data;
create policy "authenticated full access" on overview_data
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on jarvis_state;
create policy "authenticated full access" on jarvis_state
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- RLS policies only control WHICH rows a role can see/touch — they don't by
-- themselves grant a role access to the table at all. A table created via
-- raw SQL (as opposed to the Table Editor UI, which does this automatically)
-- has no privileges for `authenticated`/`anon` until explicitly granted, so
-- without this every query fails with "permission denied for table X" before
-- RLS is ever evaluated.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on quarantine_items to authenticated;
grant select, insert, update, delete on codex_entries to authenticated;
grant select, insert, update, delete on overview_data to authenticated;
grant select, insert, update, delete on jarvis_state to authenticated;

-- After running this: Authentication → Users → Add User, create yourself one
-- account (any email, a real password — that password becomes the app's
-- login password). Put that email in VITE_AUTH_EMAIL.
