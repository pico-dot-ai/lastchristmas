-- Add value column
alter table app.feature_flags
  add column if not exists value jsonb;

-- Drop existing policy if present, then recreate
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'app' and tablename = 'feature_flags' and policyname = 'feature_flags_upsert_logging'
  ) then
    execute 'drop policy "feature_flags_upsert_logging" on app.feature_flags';
  end if;
  execute '
    create policy "feature_flags_upsert_logging" on app.feature_flags
      for all using (key = ''logging'' and auth.role() = ''authenticated'')
      with check (key = ''logging'' and auth.role() = ''authenticated'')
  ';
end$$;

-- Seed logging flag
insert into app.feature_flags (key, enabled, value)
values ('logging', false, '{"retentionDays":7}')
on conflict (key) do update
set enabled = excluded.enabled,
    value = excluded.value;
