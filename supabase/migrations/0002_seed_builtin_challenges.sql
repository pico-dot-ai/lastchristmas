-- Seed built-in challenges with stable IDs to avoid duplicates
insert into app.challenges (id, name, type, trigger_description, start_at, end_at, rules, created_by, feature_flag_key, is_public)
values
  ('11111111-1111-1111-1111-111111111111', 'Whamageddon', 'whamageddon', 'Original “Last Christmas” by Wham! only; remixes/covers safe.', null, null, '{"window":"day after Thanksgiving to Dec 24","out_rule":"out on first recognized hearing of original recording"}'::jsonb, null, null, true),
  ('22222222-2222-2222-2222-222222222222', 'Little Drummer Boy Challenge', 'ldbc', 'Any recognizable version of “Little Drummer Boy” counts.', null, null, '{"window":"day after Thanksgiving to Dec 24","out_rule":"out on first recognized hearing (covers/samples included)"}'::jsonb, null, null, true)
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    trigger_description = excluded.trigger_description,
    rules = excluded.rules,
    is_public = excluded.is_public;
