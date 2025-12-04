-- Create public copies for feature flags and debug logs to work with PostgREST default schema
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  enabled boolean not null default false,
  value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.debug_logs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

-- Seed logging flag if missing
insert into public.feature_flags (key, enabled, value)
values ('logging', false, '{"retentionDays":7}')
on conflict (key) do update set enabled = excluded.enabled, value = excluded.value;

-- RLS
alter table public.feature_flags enable row level security;
alter table public.debug_logs enable row level security;

-- Policies: allow anon/auth to read logging flag and toggle it
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='feature_flags' and policyname='feature_flags_select_logging_public') then
    execute 'drop policy "feature_flags_select_logging_public" on public.feature_flags';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='feature_flags' and policyname='feature_flags_upsert_logging_public') then
    execute 'drop policy "feature_flags_upsert_logging_public" on public.feature_flags';
  end if;
  execute '
    create policy "feature_flags_select_logging_public" on public.feature_flags
      for select using (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
  ';
  execute '
    create policy "feature_flags_upsert_logging_public" on public.feature_flags
      for all using (key = ''logging'' and auth.role() in (''anon'',''authenticated''))
      with check (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
  ';
end$$;

-- Debug logs policies: insert by anyone, select/delete by authenticated
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='debug_logs' and policyname='debug_logs_insert_public') then
    execute 'drop policy "debug_logs_insert_public" on public.debug_logs';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='debug_logs' and policyname='debug_logs_select_public') then
    execute 'drop policy "debug_logs_select_public" on public.debug_logs';
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='debug_logs' and policyname='debug_logs_delete_public') then
    execute 'drop policy "debug_logs_delete_public" on public.debug_logs';
  end if;
  execute '
    create policy "debug_logs_insert_public" on public.debug_logs
      for insert with check (true);
  ';
  execute '
    create policy "debug_logs_select_public" on public.debug_logs
      for select using (auth.role() = ''authenticated'');
  ';
  execute '
    create policy "debug_logs_delete_public" on public.debug_logs
      for delete using (auth.role() = ''authenticated'');
  ';
end$$;
