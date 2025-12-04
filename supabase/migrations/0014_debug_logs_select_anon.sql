-- Allow anonymous read access to api.debug_logs for debugging UI
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'api' and tablename = 'debug_logs' and policyname = 'debug_logs_select_api'
  ) then
    execute 'drop policy "debug_logs_select_api" on api.debug_logs';
  end if;

  execute '
    create policy "debug_logs_select_api" on api.debug_logs
      for select using (auth.role() in (''anon'',''authenticated''));
  ';
end$$;
