-- Add richer profile fields for users
alter table app.users
  add column if not exists first_name text,
  add column if not exists last_name text;
