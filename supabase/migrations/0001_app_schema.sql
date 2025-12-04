-- Create dedicated schema
create schema if not exists app;

-- Ensure roles resolve the app schema
alter role authenticated set search_path = public, app;
alter role anon set search_path = public, app;

-- Users (profile)
create table if not exists app.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  dob date,
  created_at timestamptz not null default now()
);

alter table app.users enable row level security;

create policy "users_self_select" on app.users
  for select using (auth.uid() = id);

create policy "users_self_insert" on app.users
  for insert with check (auth.uid() = id);

create policy "users_self_update" on app.users
  for update using (auth.uid() = id);

-- Groups
create table if not exists app.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  requires_approval boolean not null default false,
  created_by uuid not null references app.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists groups_created_by_idx on app.groups (created_by);

-- Group members
create table if not exists app.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references app.groups (id) on delete cascade,
  user_id uuid not null references app.users (id) on delete cascade,
  role text not null check (role in ('admin','member')),
  status text not null default 'active' check (status in ('active','left','removed')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_user_idx on app.group_members (user_id);
create index if not exists group_members_group_idx on app.group_members (group_id);
alter table app.group_members enable row level security;

create policy "group_members_self_or_group_admin_select" on app.group_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from app.group_members gm2
      where gm2.group_id = group_id and gm2.user_id = auth.uid() and gm2.role = 'admin' and gm2.status = 'active'
    )
  );

create policy "group_members_insert_by_self_or_admin" on app.group_members
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from app.group_members gm2
      where gm2.group_id = group_id and gm2.user_id = auth.uid() and gm2.role = 'admin' and gm2.status = 'active'
    )
  );

create policy "group_members_update_by_admin_or_self_leave" on app.group_members
  for update using (
    (user_id = auth.uid() and status in ('active','left')) -- allow self-leave
    or exists (
      select 1 from app.group_members gm2
      where gm2.group_id = group_id and gm2.user_id = auth.uid() and gm2.role = 'admin' and gm2.status = 'active'
    )
  );

-- Groups RLS (defined after group_members exists)
alter table app.groups enable row level security;

create policy "groups_visible_to_members" on app.groups
  for select using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid() and gm.status = 'active'
    )
  );

create policy "groups_insert_authenticated" on app.groups
  for insert with check (auth.role() = 'authenticated');

create policy "groups_update_by_admins" on app.groups
  for update using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

-- Challenges (global definitions)
create table if not exists app.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('whamageddon','ldbc','custom')),
  trigger_description text,
  start_at timestamptz,
  end_at timestamptz,
  rules jsonb,
  created_by uuid references app.users (id) on delete set null,
  feature_flag_key text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists challenges_type_idx on app.challenges (type);
create index if not exists challenges_public_idx on app.challenges (is_public);
alter table app.challenges enable row level security;

create policy "challenges_public_select" on app.challenges
  for select using (is_public = true or created_by = auth.uid());

create policy "challenges_insert_authenticated" on app.challenges
  for insert with check (auth.role() = 'authenticated');

create policy "challenges_update_owner" on app.challenges
  for update using (created_by = auth.uid());

-- Group challenge assignments
create table if not exists app.group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references app.groups (id) on delete cascade,
  challenge_id uuid not null references app.challenges (id) on delete cascade,
  status text not null default 'upcoming' check (status in ('upcoming','active','ended','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists group_challenges_group_idx on app.group_challenges (group_id);
alter table app.group_challenges enable row level security;

create policy "group_challenges_visible_to_members" on app.group_challenges
  for select using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.status = 'active'
    )
  );

create policy "group_challenges_insert_by_admins" on app.group_challenges
  for insert with check (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

create policy "group_challenges_update_by_admins" on app.group_challenges
  for update using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

-- Participants
create table if not exists app.participants (
  id uuid primary key default gen_random_uuid(),
  group_challenge_id uuid not null references app.group_challenges (id) on delete cascade,
  user_id uuid not null references app.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','in','out')),
  joined_at timestamptz,
  opted_out_at timestamptz,
  unique (group_challenge_id, user_id)
);

create index if not exists participants_user_idx on app.participants (user_id);
create index if not exists participants_group_challenge_idx on app.participants (group_challenge_id);
alter table app.participants enable row level security;

create policy "participants_visible_to_self_or_group" on app.participants
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from app.group_members gm
      where gm.group_id = (select gc.group_id from app.group_challenges gc where gc.id = group_challenge_id)
        and gm.user_id = auth.uid()
        and gm.status = 'active'
    )
  );

create policy "participants_insert_by_admins_or_self" on app.participants
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from app.group_members gm
      where gm.group_id = (select gc.group_id from app.group_challenges gc where gc.id = group_challenge_id)
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.status = 'active'
    )
  );

create policy "participants_update_by_self_or_admin" on app.participants
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from app.group_members gm
      where gm.group_id = (select gc.group_id from app.group_challenges gc where gc.id = group_challenge_id)
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
        and gm.status = 'active'
    )
  );

-- Outs (knockout events)
create table if not exists app.outs (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references app.participants (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  note text
);

create index if not exists outs_participant_idx on app.outs (participant_id);
alter table app.outs enable row level security;

create policy "outs_select_visible_to_group" on app.outs
  for select using (
    exists (
      select 1 from app.participants p
      join app.group_challenges gc on gc.id = p.group_challenge_id
      join app.group_members gm on gm.group_id = gc.group_id
      where p.id = participant_id and gm.user_id = auth.uid() and gm.status = 'active'
    )
  );

create policy "outs_insert_by_participant" on app.outs
  for insert with check (
    exists (
      select 1 from app.participants p
      where p.id = participant_id and p.user_id = auth.uid()
    )
  );

-- Invites
create table if not exists app.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references app.groups (id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references app.users (id) on delete cascade,
  invite_code text not null,
  expires_at timestamptz,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  require_approval boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists invites_group_idx on app.invites (group_id);
create index if not exists invites_email_idx on app.invites (invited_email);
alter table app.invites enable row level security;

create policy "invites_visible_to_group_admins" on app.invites
  for select using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

create policy "invites_insert_by_admins" on app.invites
  for insert with check (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

create policy "invites_update_by_admins" on app.invites
  for update using (
    exists (
      select 1 from app.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid() and gm.role = 'admin' and gm.status = 'active'
    )
  );

-- Feature flags
create table if not exists app.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  enabled boolean not null default false,
  audience jsonb,
  created_at timestamptz not null default now()
);

alter table app.feature_flags enable row level security;

create policy "feature_flags_select" on app.feature_flags
  for select using (true);

create policy "feature_flags_admin_only_modify" on app.feature_flags
  for all using (false) with check (false);

-- Optional: prevent email leakage by avoiding exposure in app.users.
-- Any lookups by email should go through server/edge functions, not direct client queries.
