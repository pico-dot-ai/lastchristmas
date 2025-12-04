-- Drop duplicate tables in public and app schemas (no data migration needed)
drop table if exists public.feature_flags cascade;
drop table if exists public.debug_logs cascade;
drop table if exists app.feature_flags cascade;
drop table if exists app.debug_logs cascade;
