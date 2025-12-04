-- Debug logs table
create table if not exists app.debug_logs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  user_id uuid references app.users (id) on delete set null
);

alter table app.debug_logs enable row level security;

-- Allow inserts from anon/authenticated (logging may occur before auth completes)
create policy "debug_logs_insert_any" on app.debug_logs
  for insert with check (true);

-- Allow authenticated users to read all logs (adjust if you want stricter visibility)
create policy "debug_logs_select_auth" on app.debug_logs
  for select using (auth.role() = 'authenticated');

-- Allow authenticated users to delete logs
create policy "debug_logs_delete_auth" on app.debug_logs
  for delete using (auth.role() = 'authenticated');
