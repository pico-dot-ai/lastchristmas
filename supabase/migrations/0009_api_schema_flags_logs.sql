-- Create api schema for feature flags and debug logs (REST expects api schema)
create schema if not exists api;

create table if not exists api.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  enabled boolean not null default false,
  value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists api.debug_logs (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

insert into api.feature_flags (key, enabled, value)
values ('logging', false, '{"retentionDays":7}')
on conflict (key) do update set enabled = excluded.enabled, value = excluded.value;

alter table api.feature_flags enable row level security;
alter table api.debug_logs enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='api' and tablename='feature_flags' and policyname='feature_flags_select_logging_api') then
    execute 'drop policy "feature_flags_select_logging_api" on api.feature_flags';
  end if;
  if exists (select 1 from pg_policies where schemaname='api' and tablename='feature_flags' and policyname='feature_flags_upsert_logging_api') then
    execute 'drop policy "feature_flags_upsert_logging_api" on api.feature_flags';
  end if;
  execute '
    create policy "feature_flags_select_logging_api" on api.feature_flags
      for select using (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
  ';
  execute '
    create policy "feature_flags_upsert_logging_api" on api.feature_flags
      for all using (key = ''logging'' and auth.role() in (''anon'',''authenticated''))
      with check (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
  ';
end$$;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_insert_api') then
    execute 'drop policy "debug_logs_insert_api" on api.debug_logs';
  end if;
  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_select_api') then
    execute 'drop policy "debug_logs_select_api" on api.debug_logs';
  end if;
  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_delete_api') then
    execute 'drop policy "debug_logs_delete_api" on api.debug_logs';
  end if;
  execute '
    create policy "debug_logs_insert_api" on api.debug_logs
      for insert with check (true);
  ';
  execute '
    create policy "debug_logs_select_api" on api.debug_logs
      for select using (auth.role() = ''authenticated'');
  ';
  execute '
    create policy "debug_logs_delete_api" on api.debug_logs
      for delete using (auth.role() = ''authenticated'');
  ';
end$$;
