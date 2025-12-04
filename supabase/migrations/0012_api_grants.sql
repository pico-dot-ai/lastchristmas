-- Ensure anon/authenticated can use api schema and tables
grant usage on schema api to anon, authenticated;
grant select, insert, update, delete on api.feature_flags to anon, authenticated;
grant select, insert, update, delete on api.debug_logs to anon, authenticated;

-- RLS policies may still gate access; ensure they exist for select/insert/upsert
do $$
begin
  -- feature_flags select/upsert
  if exists (select 1 from pg_policies where schemaname='api' and tablename='feature_flags' and policyname='feature_flags_select_logging_api') then
    null;
  else
    execute '
      create policy "feature_flags_select_logging_api" on api.feature_flags
        for select using (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
    ';
  end if;

  if exists (select 1 from pg_policies where schemaname='api' and tablename='feature_flags' and policyname='feature_flags_upsert_logging_api') then
    null;
  else
    execute '
      create policy "feature_flags_upsert_logging_api" on api.feature_flags
        for all using (key = ''logging'' and auth.role() in (''anon'',''authenticated''))
        with check (key = ''logging'' and auth.role() in (''anon'',''authenticated''));
    ';
  end if;

  -- debug_logs select/insert/delete
  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_insert_api') then
    null;
  else
    execute '
      create policy "debug_logs_insert_api" on api.debug_logs
        for insert with check (true);
    ';
  end if;

  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_select_api') then
    null;
  else
    execute '
      create policy "debug_logs_select_api" on api.debug_logs
        for select using (auth.role() in (''anon'',''authenticated''));
    ';
  end if;

  if exists (select 1 from pg_policies where schemaname='api' and tablename='debug_logs' and policyname='debug_logs_delete_api') then
    null;
  else
    execute '
      create policy "debug_logs_delete_api" on api.debug_logs
        for delete using (auth.role() in (''anon'',''authenticated''));
    ';
  end if;
end$$;
