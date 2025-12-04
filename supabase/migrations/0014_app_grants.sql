-- Ensure anon/authenticated can access app schema tables (RLS still applies)
grant usage on schema app to anon, authenticated;
grant select, insert, update, delete on app.users to anon, authenticated;
