-- Supabase schema for KeepAlive

create extension if not exists "pgcrypto";

-- Users table (mirrors auth.users id)
create table if not exists public.users (
  id uuid primary key,
  email text,
  plan text default 'free',
  status_slug text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists public.monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  url text not null,
  type text not null default 'http',
  interval_seconds int not null default 60,
  status text not null default 'unknown',
  last_is_up boolean,
  last_pinged_at timestamptz,
  last_response_time int,
  last_status_code int,
  last_error_message text,
  created_at timestamptz default now()
);

create index if not exists monitors_user_id_idx on public.monitors(user_id);

create table if not exists public.pings (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  status_code int,
  response_time int,
  is_up boolean not null,
  created_at timestamptz default now()
);

create index if not exists pings_monitor_id_created_at_idx on public.pings(monitor_id, created_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  type text not null,
  target text not null,
  created_at timestamptz default now()
);

create index if not exists alerts_monitor_id_idx on public.alerts(monitor_id);

-- RLS
alter table public.users enable row level security;
alter table public.monitors enable row level security;
alter table public.pings enable row level security;
alter table public.alerts enable row level security;

-- Users: user can read/update their own profile row
create policy if not exists "users_select_own" on public.users
for select using (id = auth.uid());

create policy if not exists "users_update_own" on public.users
for update using (id = auth.uid());

-- Monitors: user can CRUD own
create policy if not exists "monitors_select_own" on public.monitors
for select using (user_id = auth.uid());

create policy if not exists "monitors_insert_own" on public.monitors
for insert with check (user_id = auth.uid());

create policy if not exists "monitors_update_own" on public.monitors
for update using (user_id = auth.uid());

create policy if not exists "monitors_delete_own" on public.monitors
for delete using (user_id = auth.uid());

-- Pings: user can read pings for their monitors
create policy if not exists "pings_select_own" on public.pings
for select using (
  exists (
    select 1 from public.monitors m
    where m.id = pings.monitor_id and m.user_id = auth.uid()
  )
);

-- Alerts: user can CRUD alerts for their monitors
create policy if not exists "alerts_select_own" on public.alerts
for select using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_insert_own" on public.alerts
for insert with check (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_update_own" on public.alerts
for update using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_delete_own" on public.alerts
for delete using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);
