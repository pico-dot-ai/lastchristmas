-- Add accent_color to app.users to store profile gradient selections
alter table app.users
add column if not exists accent_color text;
