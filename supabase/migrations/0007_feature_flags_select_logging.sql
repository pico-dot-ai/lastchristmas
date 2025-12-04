-- Allow reading the logging feature flag for anon/auth users (needed by /debug UI)
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'app' and tablename = 'feature_flags' and policyname = 'feature_flags_select_logging'
  ) then
    execute 'drop policy "feature_flags_select_logging" on app.feature_flags';
  end if;
  execute '
    create policy "feature_flags_select_logging" on app.feature_flags
      for select using (key = ''logging'' and auth.role() in (''anon'', ''authenticated''));
  ';
end$$;
