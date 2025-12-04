-- Relax logging flag policy to allow anon/authenticated to toggle
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'app' and tablename = 'feature_flags' and policyname = 'feature_flags_upsert_logging'
  ) then
    execute 'drop policy "feature_flags_upsert_logging" on app.feature_flags';
  end if;
  execute '
    create policy "feature_flags_upsert_logging" on app.feature_flags
      for all using (key = ''logging'' and auth.role() in (''anon'', ''authenticated''))
      with check (key = ''logging'' and auth.role() in (''anon'', ''authenticated''))
  ';
end$$;
