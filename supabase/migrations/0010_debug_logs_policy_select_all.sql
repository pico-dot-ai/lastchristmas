-- Relax debug_logs select policy to allow anon/auth to read logs for troubleshooting
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'debug_logs' and policyname = 'debug_logs_select_public'
  ) then
    execute 'drop policy "debug_logs_select_public" on public.debug_logs';
  end if;
  execute '
    create policy "debug_logs_select_public" on public.debug_logs
      for select using (auth.role() in (''anon'', ''authenticated''));
  ';
end$$;
