-- Run this once in the Supabase project's SQL Editor (Database → SQL Editor
-- → New query) before the app can read/write anything. Safe to re-run — each
-- statement is idempotent.

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

alter table quarantine_items enable row level security;
alter table codex_entries enable row level security;
alter table overview_data enable row level security;

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

-- After running this: Authentication → Users → Add User, create yourself one
-- account (any email, a real password — that password becomes the app's
-- login password). Put that email in VITE_AUTH_EMAIL.
